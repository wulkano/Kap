'use strict';
import electron from 'electron';
import Insight from 'insight';

const {parse} = require('semver');

const pkg = require('../../package');

const version = parse(pkg.version);
const {remote} = electron;

const trackingCode = 'UA-84705099-2';
const insight = new Insight({trackingCode, pkg});

let settings = null;
const track = (...paths) => {
  if (!settings) {
    settings = remote.require('./common/settings');
  }
  const allowAnalytics = settings.get('allowAnalytics');

  if (allowAnalytics) {
    console.log('Tracking', `v${version.major}.${version.minor}`, ...paths);
    insight.track(`v${version.major}.${version.minor}`, ...paths);
  }
};

export {
  track
};
