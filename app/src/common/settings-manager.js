import {homedir} from 'os';
import {app} from 'electron';
import settings from 'electron-settings';
import objectPath from 'object-path';
import aperture from 'aperture';

const DEFAULTS = {
  kapturesDir: `${homedir()}/Movies/Kaptures`,
  openOnStartup: false,
  allowAnalytics: true,
  showCursor: true,
  highlightClicks: false,
  hideDesktopIcons: false,
  doNotDisturb: false,
  record60fps: false,
  recordKeyboardShortcut: true,
  recordAudio: false,
  audioInputDeviceId: null,
  dimensions: {
    height: 512,
    width: 512,
    ratio: [1, 1],
    ratioLocked: false
  }
};

const DEFAULT_VOLATILES = {
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

export const DEFAULT_CROPPER_WINDOW_POSITION = 'center';

const volatiles = JSON.parse(JSON.stringify(DEFAULT_VOLATILES));

// We need to sync every setting that can be modified externally
// e.g. the `openOnStartup` setting can be modified via
// macOS' System Preferences.app
const sync = () => {
  settings.setSync('openOnStartup', app.getLoginItemSettings().openAtLogin);
};

export const init = async () => {
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
};

export const get = key => {
  sync();
  return objectPath.get(volatiles, key) || settings.getSync(key);
};

export const getAll = () => {
  sync();
  return Object.assign({}, volatiles, settings.getSync());
};

export const set = (key, value, {volatile = false} = {}) => {
  if (volatile) {
    return objectPath.set(volatiles, key, value);
  }

  settings.setSync(key, value);
};

export const observe = (keyPath, handler) => settings.observe(keyPath, handler);

export const reset = async keyPath => {
  await settings.setSync(keyPath, objectPath.get(DEFAULT_VOLATILES, keyPath));
  objectPath.set(volatiles, keyPath, settings.getSync(keyPath));
};
