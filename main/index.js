'use strict';

const {app, globalShortcut} = require('electron');
const prepareNext = require('electron-next');

const {initializeTray} = require('./tray');
const {openCropperWindow} = require('./cropper');
const plugins = require('./common/plugins');
const {initializeAnalytics} = require('./common/analytics');
const initializeExportList = require('./export-list');
const {openEditorWindow} = require('./editor');
const {track} = require('./common/analytics');

const filesToOpen = [];

app.on('open-file', (event, path) => {
  event.preventDefault();

  if (app.isReady()) {
    track('editor/opened/running');
    openEditorWindow(path);
  } else {
    filesToOpen.push(path);
  }
});

// Prepare the renderer once the app is ready
app.on('ready', async () => {
  app.dock.hide();

  // Ensure all plugins are up to date
  plugins.upgrade().catch(() => {});

  await prepareNext('./renderer');

  initializeAnalytics();
  initializeTray();
  initializeExportList();
  globalShortcut.register('Command+Shift+5', openCropperWindow);

  for (const file of filesToOpen) {
    track('editor/opened/startup');
    openEditorWindow(file);
  }
});

app.on('window-all-closed', event => event.preventDefault());
