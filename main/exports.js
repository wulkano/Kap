'use strict';

const {BrowserWindow, ipcMain} = require('electron');
const pEvent = require('p-event');

const loadRoute = require('./utils/routes');

let exportsWindow = null;

const openExportsWindow = async () => {
  if (exportsWindow) {
    exportsWindow.focus();
  } else {
    exportsWindow = new BrowserWindow({
      title: 'Exports',
      width: 320,
      height: 360,
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      titleBarStyle: 'hiddenInset',
      show: false,
      frame: false,
      transparent: true,
      vibrancy: 'ultra-dark'
    });

    const titlebarHeight = 37;
    exportsWindow.setSheetOffset(titlebarHeight);

    loadRoute(exportsWindow, 'exports');

    exportsWindow.on('close', () => {
      exportsWindow = null;
    });

    await pEvent(ipcMain, 'exports-ready');
    exportsWindow.show();
  }

  return exportsWindow;
};

const getExportsWindow = () => exportsWindow;

module.exports = {
  openExportsWindow,
  getExportsWindow
};
