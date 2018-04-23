'use strict';

const {app, globalShortcut} = require('electron');
const prepareNext = require('electron-next');

const {initializeTray} = require('./tray');
const {openCropperWindow} = require('./cropper');

// Prepare the renderer once the app is ready
app.on('ready', async () => {
  app.dock.hide();
  await prepareNext('./renderer');
  global.tray = initializeTray();
  globalShortcut.register('Cmd+Shift+5', openCropperWindow);
});

app.on('window-all-closed', event => event.preventDefault());
