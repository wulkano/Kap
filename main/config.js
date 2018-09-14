'use strict';

const {BrowserWindow} = require('electron');
const ipc = require('electron-better-ipc');

const loadRoute = require('./utils/routes');

const configWindows = new Map();

const openConfigWindow = async (pluginName, services) => {
  if (configWindows.has(pluginName)) {
    configWindows.get(pluginName).focus();
  } else {
    const configWindow = new BrowserWindow({
      width: 320,
      height: 360,
      resizable: false,
      minimizable: false,
      maximizable: false,
      titleBarStyle: 'hiddenInset',
      show: false
    });

    loadRoute(configWindow, 'config');

    configWindow.on('closed', () => {
      configWindows.delete(pluginName);
    });

    configWindow.webContents.on('did-finish-load', async () => {
      ipc.callRenderer(configWindow, 'plugin', {pluginName, services});
      configWindow.show();
    });
  }
};

module.exports = {
  openConfigWindow
};
