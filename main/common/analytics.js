'use strict';

const util = require('electron-util');
const Insight = require('insight');
const {parse} = require('semver');
const pkg = require('../../package');
const settings = require('./settings');

const trackingCode = 'UA-84705099-2';
const insight = new Insight({trackingCode, pkg});
const version = parse(pkg.version);

const track = (...paths) => {
  const allowAnalytics = settings.get('allowAnalytics');

  if (allowAnalytics) {
    console.log('Tracking', `v${version.major}.${version.minor}`, ...paths);
    insight.track(`v${version.major}.${version.minor}`, ...paths);
  }
};

const initializeAnalytics = () => {
  if (util.isFirstAppLaunch()) {
    insight.track('install');
  }

  if (settings.get('version') !== pkg.version) {
    track('install');
    settings.set('version', pkg.version);
  }
};

module.exports = {
  initializeAnalytics,
  track
};
