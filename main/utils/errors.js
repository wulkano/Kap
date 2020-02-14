'use strict';

const {dialog} = require('electron');
const ensureError = require('ensure-error');

const showError = (error, {title} = {}) => {
  const ensuredError = ensureError(error);

  dialog.showErrorBox(title || ensuredError.name, ensuredError.stack);
};

module.exports = {showError};
