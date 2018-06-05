'use strict';

const {app, globalShortcut} = require('electron');
const prepareNext = require('electron-next');

const {initializeTray} = require('./tray');
const {openCropperWindow} = require('./cropper');
const plugins = require('./common/plugins');
const initializeExportList = require('./export-list');

// Prepare the renderer once the app is ready
app.on('ready', async () => {
  app.dock.hide();

  // Ensure all plugins are up to date
  plugins.upgrade().catch(() => {});

  await prepareNext('./renderer');

  initializeTray();
  initializeExportList();
  globalShortcut.register('Cmd+Shift+5', openCropperWindow);
});

app.on('window-all-closed', event => event.preventDefault());
