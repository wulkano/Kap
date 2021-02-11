import electron, {BrowserWindow} from 'electron';
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
export default class KapWindow<State = any> {
  private static windows = new Map<number, KapWindow>();

  static getAllWindows() {
    return [...this.windows.values()];
  }

  static fromId(id: number) {
    return this.windows.get(id);
  }

  static defaultOptions = {
    waitForMount: true
  };

  private readyPromise: Promise<void>
  private cleanupMethods: Function[] = [];
  private options: KapWindowOptions<State>;

  browserWindow: BrowserWindow;
  state?: State;

  constructor(props: KapWindowOptions<State>) {
    const {
      route,
      waitForMount,
      initialState,
      ...rest
    } = props;

    this.browserWindow = new BrowserWindow({
      ...rest,
      webPreferences: {
        nodeIntegration: true,
        ...rest.webPreferences
      },
      show: false
    });

    this.cleanupMethods = [];
    this.options = {
      ...KapWindow.defaultOptions,
      ...props
    };

    this.state = initialState;
    loadRoute(this.browserWindow, route);
    this.readyPromise = this.setupWindow();
  }

  get id() {
    return this.browserWindow.id;
  }

  get webContents() {
    return this.browserWindow.webContents;
  }

  private async setupWindow() {
    const {waitForMount} = this.options;

    KapWindow.windows.set(this.id, this);

    this.browserWindow.on('close', this.cleanup);
    this.browserWindow.on('closed', this.cleanup);

    this.webContents.on('did-finish-load', async () => {
      if (this.state) {
        console.log('sending state', this.state);
        this.callRenderer('kap-window-state', this.state);
      }
    });

    if (waitForMount) {
      return new Promise<void>(resolve => {
        this.answerRenderer('kap-window-mount', () => {
          this.browserWindow.show();
          resolve();
        });
      });
    } else {
      await pEvent(this.webContents, 'did-finish-load');
      this.browserWindow.show();
    }
  }

  cleanup = () => {
    console.log('Cleaning up', this.cleanupMethods);
    KapWindow.windows.delete(this.id);
    for (const method of this.cleanupMethods) {
      method?.();
    }
  }

  callRenderer = <T, R>(channel: string, data: T) => {
    return ipc.callRenderer<T, R>(this.browserWindow, channel, data);
  }

  answerRenderer = <T, R>(channel: string, callback: (data: T, window: electron.BrowserWindow) => R) => {
    this.cleanupMethods.push(ipc.answerRenderer(this.browserWindow, channel, callback));
  }

  setState = (partialState: State) => {
    this.state = {
      ...this.state,
      ...partialState
    };

    this.callRenderer('kap-window-state', this.state);
  }

  whenReady = async () => {
    return this.readyPromise;
  }
}
