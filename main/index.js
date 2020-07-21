'use strict';

const {app} = require('electron');
const prepareNext = require('electron-next');
const {is, enforceMacOSAppLocation} = require('electron-util');
const log = require('electron-log');
const {autoUpdater} = require('electron-updater');
const toMilliseconds = require('@sindresorhus/to-milliseconds');

const {initializeTray} = require('./tray');
const plugins = require('./common/plugins');
const {initializeAnalytics} = require('./common/analytics');
const initializeExportList = require('./export-list');
const {openCropperWindow, isCropperOpen, closeAllCroppers} = require('./cropper');
const {track} = require('./common/analytics');
const {initializeGlobalAccelerators} = require('./global-accelerators');
const {setApplicationMenu} = require('./menus');
const openFiles = require('./utils/open-files');
const {initializeExportOptions} = require('./export-options');
const settings = require('./common/settings');
const {hasMicrophoneAccess, ensureScreenCapturePermissions} = require('./common/system-permissions');
const {handleDeepLink} = require('./utils/deep-linking');
const {checkForActiveRecording} = require('./recording-history');

require('./utils/sentry');
require('./utils/errors').setupErrorHandling();

const filesToOpen = [];

app.commandLine.appendSwitch('--enable-features', 'OverlayScrollbar');

app.on('open-file', (event, path) => {
  event.preventDefault();

  if (app.isReady()) {
    track('editor/opened/running');
    openFiles(path);
  } else {
    filesToOpen.push(path);
  }
});

const initializePlugins = async () => {
  if (!is.development) {
    try {
      await plugins.prune();
      await plugins.upgrade();
    } catch (error) {
      console.log(error);
    }
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
  app.setAboutPanelOptions({copyright: 'Copyright © Wulkano'});

  // Ensure the app is in the Applications folder
  enforceMacOSAppLocation();

  // Ensure all plugins are up to date
  initializePlugins();

  await prepareNext('./renderer');

  initializeAnalytics();
  initializeTray();
  initializeExportList();
  initializeGlobalAccelerators();
  initializeExportOptions();
  setApplicationMenu();

  if (!app.isDefaultProtocolClient('kap')) {
    app.setAsDefaultProtocolClient('kap');
  }

  if (filesToOpen.length > 0) {
    track('editor/opened/startup');
    openFiles(...filesToOpen);
    checkForActiveRecording();
  } else if (
    !(await checkForActiveRecording()) &&
    !app.getLoginItemSettings().wasOpenedAtLogin &&
    ensureScreenCapturePermissions() &&
    (!settings.get('recordAudio') || hasMicrophoneAccess())
  ) {
    openCropperWindow();
  }

  checkForUpdates();
})();

app.on('before-quit', closeAllCroppers);

app.on('window-all-closed', event => {
  app.dock.hide();
  event.preventDefault();
});

app.on('browser-window-created', () => {
  if (!isCropperOpen()) {
    app.dock.show();
  }
});

app.on('will-finish-launching', () => {
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });
});
