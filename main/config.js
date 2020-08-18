'use strict';

const {BrowserWindow} = require('electron');
const {ipcMain: ipc} = require('electron-better-ipc');
const pEvent = require('p-event');

const loadRoute = require('./utils/routes');
const {openPrefsWindow} = require('./preferences');

const openConfigWindow = async pluginName => {
  const prefsWindow = await openPrefsWindow();
  const configWindow = new BrowserWindow({
    width: 320,
    height: 436,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    titleBarStyle: 'hiddenInset',
    show: false,
    parent: prefsWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  loadRoute(configWindow, 'config');

  configWindow.webContents.on('did-finish-load', async () => {
    await ipc.callRenderer(configWindow, 'plugin', pluginName);
    configWindow.show();
  });

  await pEvent(configWindow, 'closed');
};

const openEditorConfigWindow = async (pluginName, serviceTitle, editorWindow) => {
  const configWindow = new BrowserWindow({
    width: 480,
    height: 420,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    titleBarStyle: 'hiddenInset',
    show: false,
    parent: editorWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  loadRoute(configWindow, 'config');

  configWindow.webContents.on('did-finish-load', async () => {
    await ipc.callRenderer(configWindow, 'edit-service', {pluginName, serviceTitle});
    configWindow.show();
  });

  await pEvent(configWindow, 'closed');
};

ipc.answerRenderer('open-edit-config', async ({pluginName, serviceTitle}, window) => {
  return openEditorConfigWindow(pluginName, serviceTitle, window);
});

module.exports = {
  openConfigWindow
};
