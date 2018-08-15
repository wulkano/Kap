'use strict';

const firstRun = require('first-run');
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
  if (firstRun()) {
    insight.track('install');
  }

  if (firstRun({name: `${pkg.name}-${pkg.version}`})) {
    track('install');
  }
};

module.exports = {
  initializeAnalytics,
  track
};
