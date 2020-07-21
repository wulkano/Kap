'use strict';

const {homedir} = require('os');
const Store = require('electron-store');

const {defaultInputDeviceId} = require('./constants');
const {hasMicrophoneAccess} = require('./system-permissions');
const {getAudioDevices, getDefaultInputDevice} = require('../utils/devices');
const shortcutToAccelerator = require('../utils/shortcut-to-accelerator');

const shortcuts = {
  triggerCropper: 'Trigger Kap'
};

const shortcutSchema = {
  type: 'string',
  default: ''
};

const store = new Store({
  schema: {
    kapturesDir: {
      type: 'string',
      default: `${homedir()}/Movies/Kaptures`
    },
    allowAnalytics: {
      type: 'boolean',
      default: true
    },
    showCursor: {
      type: 'boolean',
      default: true
    },
    highlightClicks: {
      type: 'boolean',
      default: false
    },
    record60fps: {
      type: 'boolean',
      default: false
    },
    loopExports: {
      type: 'boolean',
      default: true
    },
    recordKeyboardShortcut: {
      type: 'boolean',
      default: true
    },
    recordAudio: {
      type: 'boolean',
      default: false
    },
    audioInputDeviceId: {
      type: [
        'string',
        'null'
      ],
      default: defaultInputDeviceId
    },
    cropperShortcut: {
      type: 'object',
      properties: {
        metaKey: {
          type: 'boolean',
          default: true
        },
        altKey: {
          type: 'boolean',
          default: false
        },
        ctrlKey: {
          type: 'boolean',
          default: false
        },
        shiftKey: {
          type: 'boolean',
          default: true
        },
        character: {
          type: 'string',
          default: '5'
        }
      }
    },
    lossyCompression: {
      type: 'boolean',
      default: false
    },
    enableShortcuts: {
      type: 'boolean',
      default: true
    },
    shortcuts: {
      type: 'object',
      properties: Object.keys(shortcuts).reduce((acc, key) => ({...acc, [key]: shortcutSchema}), {})
    }
  }
});

module.exports = store;
module.exports.shortcuts = shortcuts;

if (store.has('recordKeyboardShortcut')) {
  store.set('enableShortcuts', store.get('recordKeyboardShortcut'));
  store.delete('recordKeyboardShortcut');
}

if (store.has('cropperShortcut')) {
  store.set('shortcuts.triggerCropper', shortcutToAccelerator(store.get('cropperShortcut')));
  store.delete('cropperShortcut');
}

store.set('cropper', {});
store.set('actionBar', {});

const audioInputDeviceId = store.get('audioInputDeviceId');

if (hasMicrophoneAccess()) {
  (async () => {
    const devices = await getAudioDevices();

    if (!devices.some(device => device.id === audioInputDeviceId)) {
      store.set('audioInputDeviceId', defaultInputDeviceId);
    }
  })();
}

module.exports.getSelectedInputDeviceId = () => {
  const audioInputDeviceId = store.get('audioInputDeviceId', defaultInputDeviceId);

  if (audioInputDeviceId === defaultInputDeviceId) {
    const device = getDefaultInputDevice();
    return device.id;
  }

  return audioInputDeviceId;
};
