import firstRun from 'first-run';
import Insight from 'insight';
import pkg from '../../package';
import {get as getSetting} from '../common/settings-manager';

const trackingCode = 'UA-84705099-2';
const insight = new Insight({trackingCode, pkg});

export const init = () => {
  if (firstRun()) {
    insight.track('install');
  }

  if (firstRun({name: `${pkg.name}-${pkg.version}`})) {
    insight.track(`install/${pkg.version}`);
  }
};

export const track = (...paths) => {
  console.log(getSetting('allowAnalytics'));

  if (getSetting('allowAnalytics') === true) {
    console.log('tracking');
    insight.track(...paths);
  }
};
