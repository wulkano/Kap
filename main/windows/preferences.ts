import {BrowserWindow} from 'electron';
import {promisify} from 'util';
import pEvent from 'p-event';

import {ipcMain as ipc} from 'electron-better-ipc';
import {loadRoute} from '../utils/routes';
import {track} from '../common/analytics';
import {windowManager} from './manager';

let prefsWindow: BrowserWindow | undefined;

export type PreferencesWindowOptions = any;

const openPrefsWindow = async (options?: PreferencesWindowOptions) => {
  track('preferences/opened');
  windowManager.cropper?.close();

  if (prefsWindow) {
    if (options) {
      ipc.callRenderer(prefsWindow, 'options', options);
    }

    prefsWindow.show();
    return prefsWindow;
  }

  prefsWindow = new BrowserWindow({
    title: 'Preferences',
    width: 480,
    height: 480,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    titleBarStyle: 'hiddenInset',
    show: false,
    frame: false,
    transparent: true,
    vibrancy: 'window',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  const titlebarHeight = 85;
  prefsWindow.setSheetOffset(titlebarHeight);

  prefsWindow.on('close', () => {
    prefsWindow = undefined;
  });

  loadRoute(prefsWindow, 'preferences');

  await pEvent(prefsWindow.webContents, 'did-finish-load');

  if (options) {
    ipc.callRenderer(prefsWindow, 'options', options);
  }

  ipc.callRenderer(prefsWindow, 'mount');

  // @ts-expect-error
  await promisify(ipc.answerRenderer)('preferences-ready');

  prefsWindow.show();
  return prefsWindow;
};

const closePrefsWindow = () => {
  if (prefsWindow) {
    prefsWindow.close();
  }
};

ipc.answerRenderer('open-preferences', openPrefsWindow);

windowManager.setPreferences({
  open: openPrefsWindow,
  close: closePrefsWindow
});
