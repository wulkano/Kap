const {autoUpdater, ipcMain} = require('electron');
const ms = require('ms');

const {version} = require('../package');

const reporter = require('./reporter');

const FEED_URL = `http://kap-updates.now.sh/update/osx/${version}`;

function init(window) {
  autoUpdater.setFeedURL(FEED_URL);
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, ms('5s'));

  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, ms('5m'));

  autoUpdater.on('update-available', () => console.log('update available, starting download'));

  autoUpdater.on('update-downloaded', () => {
    console.log('update downloaded, will notify the user');
    window.webContents.send('update-downloaded');
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', err => {
    console.error('Error fetching updates', err);
    reporter.report(err);
  });
}

exports.init = init;
