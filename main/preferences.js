'use strict';

const {BrowserWindow} = require('electron');
const pEvent = require('p-event');

const {ipcMain: ipc} = require('electron-better-ipc');
const {closeAllCroppers} = require('./cropper');
const loadRoute = require('./utils/routes');
const {track} = require('./common/analytics');

let prefsWindow = null;

const openPrefsWindow = async options => {
  track('preferences/opened');
  closeAllCroppers();

  if (prefsWindow) {
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
    vibrancy: 'ultra-dark',
    webPreferences: {
      nodeIntegration: true
    }
  });

  const titlebarHeight = 85;
  prefsWindow.setSheetOffset(titlebarHeight);

  prefsWindow.on('close', () => {
    prefsWindow = null;
  });

  loadRoute(prefsWindow, 'preferences');

  await pEvent(prefsWindow.webContents, 'did-finish-load');
  if (options) {
    ipc.callRenderer(prefsWindow, 'options', options);
  }

  ipc.callRenderer(prefsWindow, 'mount');

  return new Promise(resolve => {
    ipc.answerRenderer('preferences-ready', () => {
      prefsWindow.show();
      resolve(prefsWindow);
    });
  });
};

const closePrefsWindow = () => {
  if (prefsWindow) {
    prefsWindow.close();
  }
};

ipc.answerRenderer('open-preferences', openPrefsWindow);

module.exports = {
  openPrefsWindow,
  closePrefsWindow
};
