import {homedir} from 'os';

import {app} from 'electron';
import settings from 'electron-settings';
import objectPath from 'object-path';

const aperture = require('aperture')();

const DEFAULTS = {
  kapturesDir: `${homedir()}/Movies/Kaptures`,
  openOnStartup: false,
  allowAnalytics: true,
  showCursor: true,
  highlightClicks: false,
  fps: 30,
  recordAudio: false,
  audioInputDeviceId: 'none'
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

// We need to sync every setting that can be modified externally
// e.g. the `openOnStartup` setting can be modified via
// macOS' System Preferences.app
function sync() {
  settings.setSync('openOnStartup', app.getLoginItemSettings().openAtLogin);
}

function init() {
  settings.defaults(DEFAULTS);
  settings.applyDefaultsSync();
  sync();

  // We need to fetch a input device because if the user opens the app for the first time
  // and toggle the mic in the main window to record audio, we will not record any audio
  // if we do not have a input id stored.
  // TODO: if no input device is available (could happen in an iMac, for example), we need
  // to tell the user
  aperture.getAudioSources().then(devices => {
    if (devices.length > 0) {
      settings.setSync('audioInputDeviceId', devices[0].id);
    }
  });
}

function get(key) {
  sync();
  return objectPath.get(volatiles, key) || settings.getSync(key);
}

function getAll() {
  sync();
  return Object.assign({}, volatiles, settings.getSync());
}

function set(key, value, {volatile = false} = {}) {
  if (volatile) {
    return objectPath.set(volatiles, key, value);
  }
  settings.setSync(key, value);
}

function observe(keyPath, handler) {
  return settings.observe(keyPath, handler);
}

export {init, get, getAll, set, observe};
