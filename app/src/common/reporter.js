import os from 'os';
import isDev from 'electron-is-dev';
import unhandled from 'electron-unhandled';

let ravenClient;

function init() {
  if (!isDev) {
    const Raven = require('raven');

    Raven.config('https://2dffdbd619f34418817f4db3309299ce@sentry.io/255536', {
      captureUnhandledRejections: true,
      tags: {
        process: process.type,
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        platform: os.platform(),
        platform_release: os.release()
      }
     }).install();
  }
}

function report(err) {
  console.error(err);

  if (!isDev && err) {
    Raven.captureException(err);
  }
}

// Enable `electron-unhandled` only for development
// Since Raven client also captures unhandled rejections
// which should be fine in production.
if (isDev) {
  unhandled({
    logger: report
  });
}

exports.init = init;
exports.report = report;
