'use strict';

const {BrowserWindow} = require('electron');
const ipc = require('electron-better-ipc');

const loadRoute = require('./utils/routes');
const {openPrefsWindow} = require('./preferences');

const openConfigWindow = async pluginName => {
  const prefsWindow = await openPrefsWindow();
  const configWindow = new BrowserWindow({
    width: 320,
    height: 436,
    resizable: false,
    minimizable: false,
    maximizable: false,
    titleBarStyle: 'hiddenInset',
    show: false,
    parent: prefsWindow,
    modal: true
  });

  loadRoute(configWindow, 'config');

  configWindow.webContents.on('did-finish-load', async () => {
    ipc.callRenderer(configWindow, 'plugin', pluginName);
    configWindow.show();
  });

  return new Promise(resolve => {
    configWindow.on('closed', resolve);
  });
};

module.exports = {
  openConfigWindow
};
