import os from 'os';
import isDev from 'electron-is-dev';
import unhandled from 'electron-unhandled';
import util from 'electron-util';

let Raven;

export const init = () => {
  if (isDev) {
    return;
  }

  let dsn;

  if (process.type === 'renderer') {
    Raven = require('raven-js');
    dsn = 'https://2dffdbd619f34418817f4db3309299ce@sentry.io/255536';
  } else {
    Raven = require('raven');
    dsn = 'https://2dffdbd619f34418817f4db3309299ce:5d2b3b543a3a433abe928e39aff485fd@sentry.io/255536';
  }

  Raven.config(dsn, {
    captureUnhandledRejections: false,
    release: util.api.app.getVersion(),
    tags: {
      process: process.type,
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      platform: os.platform(),
      platform_release: os.release(), // eslint-disable-line camelcase
      locale: util.api.app.getLocale()
    }
  }).install();
};

export const report = err => {
  console.error(err);

  if (!isDev && Raven && err) {
    Raven.captureException(err);
  }
};

unhandled({
  logger: report
});
