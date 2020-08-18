const electron = require('electron');
const loadRoute = require('./utils/routes');
const {ipcMain: ipc} = require('electron-better-ipc');

// Has to be named BrowserWindow because of
// https://github.com/electron/electron/blob/master/lib/browser/api/browser-window.ts#L82
class BrowserWindow extends electron.BrowserWindow {
  _readyPromise = new Promise(resolve => {
    this._readyPromiseResolve = resolve;
  });

  cleanupMethods = []

  constructor(props) {
    const {
      route,
      args,
      waitForMount,
      ...rest
    } = props;

    super({
      webPreferences: {
        nodeIntegration: true,
      },
      ...rest,
      show: false
    });

    this.options = props;
    loadRoute(this, route);
    this.setupWindow();
  }

  setupWindow() {
    const {args, waitForMount} = this.options;

    this.on('close', () => {
      for (const method of this.cleanupMethods) {
        method();
      }
    });

    this.webContents.on('did-finish-load', async () => {
      if (args) {
        ipc.callRenderer(this, 'kap-window-args', args);
      }

      if (waitForMount) {
        this.answerRenderer('kap-window-mount', () => {
          this.show();
          this._readyPromiseResolve();
        });
      } else {
        this.show();
        this._readyPromiseResolve();
      }
    });
  }

  answerRenderer(channel, callback) {
    this.cleanupMethods.push(ipc.answerRenderer(this, channel, callback));
  }

  async whenReady() {
    return this._readyPromise;
  }
}

const KapWindow = BrowserWindow;

module.exports = KapWindow;
