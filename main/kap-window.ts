import electron from 'electron';
import {ipcMain as ipc} from 'electron-better-ipc';
import pEvent from 'p-event';
import loadRoute from './utils/routes';

interface KapWindowOptions<State> extends Electron.BrowserWindowConstructorOptions {
  route: string;
  waitForMount?: boolean;
  initialState?: State;
}

// Has to be named BrowserWindow because of
// https://github.com/electron/electron/blob/master/lib/browser/api/browser-window.ts#L82
class BrowserWindow<State = any> extends electron.BrowserWindow {
  private static windows = new Map<number, BrowserWindow>();

  static getAllWindows() {
    return [...this.windows.values()];
  }

  static fromId(id: number) {
    return this.windows.get(id) as BrowserWindow;
  }

  static defaultOptions = {
    waitForMount: true
  };

  private readyPromise: Promise<void>;

  options: KapWindowOptions<State>;
  cleanupMethods: Function[];
  state?: State;

  constructor(props: KapWindowOptions<State>) {
    const {
      route,
      waitForMount,
      initialState,
      ...rest
    } = props;

    super({
      ...rest,
      webPreferences: {
        nodeIntegration: true,
        ...rest.webPreferences
      },
      show: false
    });

    this.cleanupMethods = [];
    this.options = {
      ...BrowserWindow.defaultOptions,
      ...props
    };

    this.state = initialState;
    loadRoute(this, route);
    this.readyPromise = this.setupWindow();
  }

  private async setupWindow() {
    const {waitForMount} = this.options;

    BrowserWindow.windows.set(this.id, this);

    this.on('closed', this.cleanup);

    this.webContents.on('did-finish-load', async () => {
      if (this.state) {
        console.log('sending state', this.state);
        this.callRenderer('kap-window-state', this.state);
      }
    });

    await pEvent(this.webContents, 'did-finish-load');

    if (waitForMount) {
      return new Promise<void>(resolve => {
        console.log('SET IT UP');
        this.answerRenderer('kap-window-mount', () => {
          console.log('GOT IT');
          this.show();
          resolve();
        });
      });
    } else {
      this.show();
    }
  }

  cleanup() {
    BrowserWindow.windows.delete(this.id);
    for (const method of this.cleanupMethods) {
      method?.();
    }
  }

  callRenderer<T, R>(channel: string, data: T) {
    return ipc.callRenderer<T, R>(this, channel, data);
  }

  answerRenderer<T, R>(channel: string, callback: (data: T, window: electron.BrowserWindow) => R) {
    this.cleanupMethods.push(ipc.answerRenderer(this, channel, callback));
  }

  setState(partialState: State) {
    this.state = {
      ...this.state,
      ...partialState
    };

    this.callRenderer('kap-window-state', this.state);
  }

  async whenReady() {
    return this.readyPromise;
  }
}

const KapWindow = BrowserWindow;

module.exports = KapWindow;
