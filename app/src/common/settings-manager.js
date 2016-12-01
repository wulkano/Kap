import {homedir} from 'os';

import settings from 'electron-settings';
import objectPath from 'object-path';

const DEFAULTS = {
  kapturesDir: `${homedir()}/Movies/Kaptures`,
  openOnStartup: false,
  allowAnalytics: true,
  showCursor: true,
  highlightClicks: false,
  fps: 30,
  sound: false
};

const volatiles = {
  cropperWindow: {
    size: {
      width: 512,
      height: 512
    },
    position: {
      x: 'center',
      y: 'center'
    }
  }
};

function init() {
  settings.defaults(DEFAULTS);
  settings.applyDefaultsSync();
}

function get(key) {
  return objectPath.get(volatiles, key) || settings.getSync(key);
}

function getAll() {
  return Object.assign({}, volatiles, settings.getSync());
}

function set(key, value, {volatile = false} = {}) {
  if (volatile) {
    return objectPath.set(volatiles, key, value);
  }
  settings.setSync(key, value);
}

export {init, get, getAll, set};
