'use strict';

const {dialog} = require('electron');
const ensureError = require('ensure-error');
const Sentry = require('./sentry');

const showError = (error, {title, reportToSentry} = {}) => {
  const ensuredError = ensureError(error);

  console.error(error);
  if (reportToSentry) {
    Sentry.captureException(ensuredError);
  }

  dialog.showErrorBox(title || ensuredError.name, ensuredError.stack);
};

module.exports = {showError};
