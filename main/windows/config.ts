'use strict';

import {BrowserWindow} from 'electron';
import {ipcMain as ipc} from 'electron-better-ipc';
import pEvent from 'p-event';

import {loadRoute} from '../utils/routes';
import {windowManager} from './manager';

const openConfigWindow = async (pluginName: string) => {
  const prefsWindow = await windowManager.preferences?.open();
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
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  loadRoute(configWindow, 'config');

  configWindow.webContents.on('did-finish-load', async () => {
    await ipc.callRenderer(configWindow, 'plugin', pluginName);
    configWindow.show();
  });

  await pEvent(configWindow, 'closed');
};

const openEditorConfigWindow = async (pluginName: string, serviceTitle: string, editorWindow: BrowserWindow) => {
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
      nodeIntegration: true,
      contextIsolation: false
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

windowManager.setConfig({
  open: openConfigWindow
});
