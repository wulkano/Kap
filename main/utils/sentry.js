'use strict';

const Sentry = require('@sentry/electron');

Sentry.init({
  dsn: 'https://2dffdbd619f34418817f4db3309299ce@sentry.io/255536'
});

module.exports = Sentry;
