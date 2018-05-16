import firstRun from 'first-run';
import Insight from 'insight';
import {parse} from 'semver';
import pkg from '../../package';
import {get as getSetting} from '../common/settings-manager';

const trackingCode = 'UA-84705099-2';
const insight = new Insight({trackingCode, pkg});
const version = parse(pkg.version, {loose: true});

export const init = () => {
  if (firstRun()) {
    insight.track('install');
  }

  if (firstRun({name: `${pkg.name}-${pkg.version}`})) {
    insight.track(`v${version.major}.${version.minor}/install`);
  }
};

export const track = (...paths) => {
  console.log(getSetting('allowAnalytics'));

  if (getSetting('allowAnalytics') === true) {
    console.log('tracking');
    insight.track(`v${version.major}.${version.minor}`, ...paths);
  }
};
