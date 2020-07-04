'use strict';

const {dialog, clipboard} = require('electron');
const ensureError = require('ensure-error');
const cleanStack = require('clean-stack');

const showError = async (error, {title, reportToSentry} = {}) => {
  const ensuredError = ensureError(error);
  const errorTitle = title || ensuredError.name;

  console.error(error);
  if (reportToSentry) {
    // Imported here to avoid circular dependency
    const Sentry = require('./sentry');
    Sentry.captureException(ensuredError);
  }

  // This is not currently really async: https://github.com/electron/electron/issues/23319
  const {response} = await dialog.showMessageBox({
    type: 'error',
    message: errorTitle,
    detail: cleanStack(ensuredError.stack, {pretty: true}),
    buttons: [
      'OK',
      'Copy Error'
    ]
  });

  if (response === 1) {
    clipboard.writeText(`${errorTitle}\n${cleanStack(ensuredError.stack)}`);
  }
};

module.exports = {showError};
