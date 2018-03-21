import {app, autoUpdater, Notification} from 'electron';
import isDev from 'electron-is-dev';
import ms from 'ms';
import {log} from '../common/logger';
import {report} from '../common/reporter';

const URL_APP_NAME = app.getName() === 'Kap Beta' ? 'kap-beta' : 'kap';
const FEED_URL = `https://${URL_APP_NAME}-updates.now.sh/update/macos/${app.getVersion()}`;

const createInterval = () => setInterval(() => {
  autoUpdater.checkForUpdates();
}, ms('30m'));

let manualCheckTimeout;

export const init = () => {
  if (isDev) {
    return;
  }

  autoUpdater.setFeedURL(FEED_URL);

  setTimeout(() => {
    log('Checking for update…');
    autoUpdater.checkForUpdates();
  }, ms('5s')); // At this point the app is fully started and ready for everything

  let intervalId = createInterval();

  autoUpdater.on('update-available', () => {
    clearTimeout(manualCheckTimeout);
    clearInterval(intervalId);
    intervalId = undefined;
    log('Update available, starting download…');
  });

  autoUpdater.on('update-downloaded', () => {
    log('Update downloaded, will notify the user');

    const notification = new Notification({
      title: `An update for ${app.getName()} is available 🎉`,
      body: 'Click here to install it 😊'
    });

    notification.on('click', () => {
      autoUpdater.quitAndInstall();
    });

    notification.show();
  });

  autoUpdater.on('error', err => {
    if (intervalId === undefined) { // If the error occurred during the download
      intervalId = createInterval();
    }

    log('Error fetching updates', err);
    report(err);
  });
};

// The `callback` will be called if no update is available at the moment
export const checkForUpdates = callback => {
  manualCheckTimeout = setTimeout(() => {
    callback();
  }, ms('10s'));
};
