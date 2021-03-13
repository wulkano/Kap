'use strict';

import {BrowserWindow, ipcMain} from 'electron';
import pEvent from 'p-event';
import {loadRoute} from '../utils/routes';
import {windowManager} from './manager';

let exportsWindow: BrowserWindow | undefined;

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
      vibrancy: 'window',
      webPreferences: {
        nodeIntegration: true
      }
    });

    const titlebarHeight = 37;
    exportsWindow.setSheetOffset(titlebarHeight);

    loadRoute(exportsWindow, 'exports');

    exportsWindow.on('close', () => {
      exportsWindow = undefined;
    });

    await pEvent(ipcMain, 'exports-ready');
    exportsWindow.show();
  }

  return exportsWindow;
};

const getExportsWindow = () => exportsWindow;

windowManager.setExports({
  open: openExportsWindow,
  get: getExportsWindow
});
