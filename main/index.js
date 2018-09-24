'use strict';

const {app} = require('electron');
const prepareNext = require('electron-next');

const {initializeTray} = require('./tray');
const plugins = require('./common/plugins');
const {initializeAnalytics} = require('./common/analytics');
const initializeExportList = require('./export-list');
const {openEditorWindow} = require('./editor');
const {track} = require('./common/analytics');
const {initializeGlobalAccelerators} = require('./global-accelerators');

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

const initializePlugins = async () => {
  try {
    await plugins.prune();
    await plugins.upgrade();
  } catch (error) {
    console.log(error);
  }
};

// Prepare the renderer once the app is ready
(async () => {
  await app.whenReady();

  app.dock.hide();

  // Ensure all plugins are up to date
  initializePlugins();

  await prepareNext('./renderer');

  initializeAnalytics();
  initializeTray();
  initializeExportList();
  initializeGlobalAccelerators();

  for (const file of filesToOpen) {
    track('editor/opened/startup');
    openEditorWindow(file);
  }
})();

app.on('window-all-closed', event => event.preventDefault());
