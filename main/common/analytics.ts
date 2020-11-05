'use strict';

import util from 'electron-util';
import {parse} from 'semver';
import settings from './settings';

const Insight = require('insight');
const pkg = require('../../package');

const trackingCode = 'UA-84705099-2';
const insight = new Insight({trackingCode, pkg});
const version = parse(pkg.version);

export const track = (...paths: string[]) => {
  const allowAnalytics = settings.get('allowAnalytics');

  if (allowAnalytics) {
    console.log('Tracking', `v${version?.major}.${version?.minor}`, ...paths);
    insight.track(`v${version?.major}.${version?.minor}`, ...paths);
  }
};

export const initializeAnalytics = () => {
  if (util.isFirstAppLaunch()) {
    insight.track('install');
  }

  if (settings.get('version') !== pkg.version) {
    track('install');
    settings.set('version', pkg.version);
  }
};
