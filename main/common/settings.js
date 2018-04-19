'use strict';

const {homedir} = require('os');
const {app} = require('electron');
const settings = require('electron-settings');
const aperture = require('aperture');

const DEFAULTS = {
  kapturesDir: `${homedir()}/Movies/Kaptures`,
  openOnStartup: false,
  allowAnalytics: true,
  showCursor: true,
  highlightClicks: false,
  hideDesktopIcons: false,
  record60fps: false,
  recordKeyboardShortcut: true,
  doNotDisturb: false,
  recordAudio: false,
  audioInputDeviceId: null,
  dimensions: {
    x: 128,
    y: 128,
    height: 512,
    width: 512,
    ratio: [1, 1]
  },
  actionBar: {
    ratioLocked: false,
    advanced: false
  }
};

// We need to sync every setting that can be modified externally
// e.g. the `openOnStartup` setting can be modified via
// macOS' System Preferences.app
function sync() {
  settings.setSync('openOnStartup', app.getLoginItemSettings().openAtLogin);
}

async function init() {
  settings.defaults(DEFAULTS);
  settings.applyDefaultsSync();
  sync();

  // We need to fetch a input device because if the user opens the app for the first time
  // and toggle the mic in the main window to record audio, we will not record any audio
  // if we do not have a input id stored.
  // TODO: if no input device is available (could happen in an iMac, for example), we need
  // to tell the user
  const devices = await aperture.audioDevices();
  if (devices.length > 0) {
    settings.setSync('audioInputDeviceId', devices[0].id);
  }
}

function get(key) {
  sync();
  return settings.getSync(key);
}

function getAll() {
  sync();
  return settings.getSync();
}

function set(key, value) {
  settings.setSync(key, value);
}

function observe(keyPath, handler) {
  return settings.observe(keyPath, handler);
}

module.exports = {init, get, getAll, set, observe};
