const isDev = require('electron-is-dev');

let ravenClient;
if (!isDev) {
  const raven = require('raven');

  ravenClient = new raven.Client('https://dde0663d852241628dca445a0b28d3f1:354142c4b46c4894b3ba876ce803bb6f@sentry.io/101586');
  ravenClient.patchGlobal();
}

function report(err) {
  if (!isDev && err) {
    ravenClient.captureException(err);
  }
}

exports.report = report;
