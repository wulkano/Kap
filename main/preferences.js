'use strict';

const {BrowserWindow, ipcMain} = require('electron');
const pEvent = require('p-event');

const {closeAllCroppers} = require('./cropper');
const loadRoute = require('./utils/routes');
const {track} = require('./common/analytics');

let prefsWindow = null;

const openPrefsWindow = async () => {
  track('preferences/opened');
  closeAllCroppers();

  if (prefsWindow) {
    prefsWindow.show();
    return prefsWindow;
  }

  prefsWindow = new BrowserWindow({
    width: 480,
    height: 480,
    resizable: false,
    minimizable: false,
    maximizable: false,
    titleBarStyle: 'hiddenInset',
    show: false
  });

  prefsWindow.on('close', () => {
    prefsWindow = null;
  });

  loadRoute(prefsWindow, 'preferences');

  await pEvent(ipcMain, 'preferences-ready');
  prefsWindow.show();
  return prefsWindow;
};

module.exports = {
  openPrefsWindow
};
