import electron, {app, BrowserWindow, Menu} from 'electron';
import {ipcMain as ipc} from 'electron-better-ipc';
import pEvent from 'p-event';
import {customApplicationMenu, defaultApplicationMenu, MenuModifier} from '../menus/application';
import {loadRoute} from '../utils/routes';

interface KapWindowOptions<State> extends Electron.BrowserWindowConstructorOptions {
  route: string;
  waitForMount?: boolean;
  initialState?: State;
  menu?: MenuModifier;
  dock?: boolean;
}

// TODO: remove this when all windows use KapWindow
app.on('browser-window-focus', (_, window) => {
  if (!KapWindow.fromId(window.id)) {
    Menu.setApplicationMenu(Menu.buildFromTemplate(defaultApplicationMenu()));
  }
});

// Has to be named BrowserWindow because of
// https://github.com/electron/electron/blob/master/lib/browser/api/browser-window.ts#L82
export default class KapWindow<State = any> {
  static defaultOptions: Partial<KapWindowOptions<any>> = {
    waitForMount: true,
    dock: true,
    menu: defaultMenu => defaultMenu
  };

  private static readonly windows = new Map<number, KapWindow>();

  browserWindow: BrowserWindow;
  state?: State;
  menu: Menu = Menu.buildFromTemplate(defaultApplicationMenu());
  readonly id: number;

  private readonly readyPromise: Promise<void>;
  private readonly cleanupMethods: Array<() => void> = [];
  private readonly options: KapWindowOptions<State>;

  constructor(private readonly props: KapWindowOptions<State>) {
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
        contextIsolation: false,
        ...rest.webPreferences
      },
      show: false
    });

    this.id = this.browserWindow.id;
    KapWindow.windows.set(this.id, this);

    this.cleanupMethods = [];
    this.options = {
      ...KapWindow.defaultOptions,
      ...props
    };

    this.state = initialState;
    this.generateMenu();
    this.readyPromise = this.setupWindow();
  }

  static getAllWindows() {
    return [...this.windows.values()];
  }

  static fromId(id: number) {
    return this.windows.get(id);
  }

  get webContents() {
    return this.browserWindow.webContents;
  }

  cleanup = () => {
    KapWindow.windows.delete(this.id);

    for (const method of this.cleanupMethods) {
      method();
    }
  };

  callRenderer = async <T, R>(channel: string, data?: T) => {
    return ipc.callRenderer<T, R>(this.browserWindow, channel, data);
  };

  answerRenderer = <T, R>(channel: string, callback: (data: T, window: electron.BrowserWindow) => R) => {
    this.cleanupMethods.push(ipc.answerRenderer(this.browserWindow, channel, callback));
  };

  setState = (partialState: State) => {
    this.state = {
      ...this.state,
      ...partialState
    };

    this.callRenderer('kap-window-state', this.state);
  };

  whenReady = async () => {
    return this.readyPromise;
  };

  private readonly generateMenu = () => {
    this.menu = Menu.buildFromTemplate(
      customApplicationMenu(this.options.menu!)
    );
  };

  private async setupWindow() {
    const {waitForMount} = this.options;

    KapWindow.windows.set(this.id, this);

    this.browserWindow.on('show', () => {
      if (this.options.dock && !app.dock.isVisible) {
        app.dock.show();
      }
    });

    this.browserWindow.on('close', this.cleanup);
    this.browserWindow.on('closed', this.cleanup);

    this.browserWindow.on('focus', () => {
      this.generateMenu();
      Menu.setApplicationMenu(this.menu);
    });

    this.webContents.on('did-finish-load', async () => {
      if (this.state) {
        this.callRenderer('kap-window-state', this.state);
      }
    });

    this.answerRenderer('kap-window-state', () => this.state);

    loadRoute(this.browserWindow, this.props.route);

    if (waitForMount) {
      return new Promise<void>(resolve => {
        this.answerRenderer('kap-window-mount', () => {
          if (!this.browserWindow.isVisible()) {
            this.browserWindow.show();
          }

          resolve();
        });
      });
    }

    await pEvent(this.webContents, 'did-finish-load');
    this.browserWindow.show();
  }

  // Use this around any call that causes:
  // TypeError: Object has been destroyed
  // private readonly executeIfNotDestroyed = (callback: () => void) => {
  //   if (!this.browserWindow.isDestroyed()) {
  //     callback();
  //   }
  // };
}
