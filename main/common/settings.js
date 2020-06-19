'use strict';

const {homedir} = require('os');
const Store = require('electron-store');

const {defaultInputDevice} = require('./constants');
const {hasMicrophoneAccess} = require('./system-permissions');
const {getAudioDevices, getDefaultInputDevice} = require('../utils/devices');

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
      default: defaultInputDevice.id
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
    }
  }
});

module.exports = store;

store.set('cropper', {});
store.set('actionBar', {});

const audioInputDeviceId = store.get('audioInputDeviceId');

if (hasMicrophoneAccess()) {
  (async () => {
    const devices = await getAudioDevices();

    if (!devices.some(device => device.id === audioInputDeviceId)) {
      store.set('audioInputDeviceId', defaultInputDevice.id);
    }
  })();
}

module.exports.getSelectedInputDeviceId = () => {
  const audioInputDeviceId = store.get('audioInputDeviceId', defaultInputDevice.id);

  if (audioInputDeviceId === defaultInputDevice.id) {
    const device = getDefaultInputDevice();
    return device.id;
  }

  return audioInputDeviceId;
};
