import {autoUpdater, ipcMain} from 'electron';
import isDev from 'electron-is-dev';
import ms from 'ms';

import {version} from '../../package';

import {log} from '../common/logger';
import reporter from '../common/reporter';

const FEED_URL = `https://kap-updates.now.sh/update/osx/${version}`;

function createInterval() {
  return setInterval(() => {
    autoUpdater.checkForUpdates();
  }, ms('30m'));
}

let manualCheckTimeout;

function init(window) {
  if (isDev) {
    return;
  }

  autoUpdater.setFeedURL(FEED_URL);

  setTimeout(() => {
    log('checking');
    autoUpdater.checkForUpdates();
  }, ms('5s')); // At this point the app is fully started and ready for everything

  let intervalId = createInterval();

  autoUpdater.on('update-available', () => {
    clearTimeout(manualCheckTimeout);
    clearInterval(intervalId);
    intervalId = undefined;
    log('update available, starting download');
  });

  autoUpdater.on('update-downloaded', () => {
    log('update downloaded, will notify the user');
    window.webContents.send('update-downloaded');
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', err => {
    if (intervalId === undefined) { // If the error occurred during the download
      intervalId = createInterval();
    }

    log('Error fetching updates', err);
    reporter.report(err);
  });
}

// The `callback` will be called if no update is available at the moment
function checkForUpdates(callback) {
  manualCheckTimeout = setTimeout(() => {
    callback();
  }, ms('10s'));
}

exports.init = init;
exports.checkForUpdates = checkForUpdates;
