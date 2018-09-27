'use strict';

const {BrowserWindow} = require('electron');
const ipc = require('electron-better-ipc');
const pEvent = require('p-event');

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
    fullscreenable: false,
    titleBarStyle: 'hiddenInset',
    show: false,
    parent: prefsWindow,
    modal: true
  });

  loadRoute(configWindow, 'config');

  configWindow.webContents.on('did-finish-load', () => {
    ipc.callRenderer(configWindow, 'plugin', pluginName);
    configWindow.show();
  });

  await pEvent(configWindow, 'closed');
};

module.exports = {
  openConfigWindow
};
