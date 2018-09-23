'use strict';

const {is} = require('electron-util');
const Sentry = require('@sentry/electron');
const settings = require('../common/settings');

if (!is.development && settings.get('allowAnalytics')) {
  Sentry.init({
    dsn: 'https://2dffdbd619f34418817f4db3309299ce@sentry.io/255536'
  });
}

module.exports = Sentry;
