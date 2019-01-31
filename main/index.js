'use strict';

const {app} = require('electron');
const prepareNext = require('electron-next');
const {is} = require('electron-util');
const log = require('electron-log');
const {autoUpdater} = require('electron-updater');
const toMilliseconds = require('@sindresorhus/to-milliseconds');

const {initializeTray} = require('./tray');
const plugins = require('./common/plugins');
const {initializeAnalytics} = require('./common/analytics');
const initializeExportList = require('./export-list');
const {openCropperWindow, isCropperOpen} = require('./cropper');
const {openEditorWindow} = require('./editor');
const {track} = require('./common/analytics');
const {initializeGlobalAccelerators} = require('./global-accelerators');
const {setApplicationMenu} = require('./menus');

require('./utils/sentry');

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

const checkForUpdates = () => {
  if (is.development) {
    return false;
  }

  // For auto-update debugging in Console.app
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';

  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, toMilliseconds({hours: 1}));

  autoUpdater.checkForUpdates();
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
  setApplicationMenu();

  for (const file of filesToOpen) {
    track('editor/opened/startup');
    openEditorWindow(file);
  }

  const {wasOpenedAtLogin} = app.getLoginItemSettings();
  const isOpeningFile = filesToOpen.length > 0;
  if (!isOpeningFile && !wasOpenedAtLogin) {
    openCropperWindow();
  }

  checkForUpdates();
})();

app.on('window-all-closed', event => {
  app.dock.hide();
  event.preventDefault();
});

app.on('browser-window-created', () => {
  if (!isCropperOpen()) {
    app.dock.show();
  }
});
