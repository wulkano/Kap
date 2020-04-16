'use strict';

const {homedir} = require('os');
const Store = require('electron-store');

const {audioDevices} = require('aperture');
const {hasMicrophoneAccess} = require('./system-permissions');

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
      default: null
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
    const devices = await audioDevices();

    if (!Array.isArray(devices)) {
      const Sentry = require('../utils/sentry');
      Sentry.captureException(new Error(`devices is not an array: ${JSON.stringify(devices)}`));
      return;
    }

    if (!devices.some(device => device.id === audioInputDeviceId)) {
      const [device] = devices;
      if (device) {
        store.set('audioInputDeviceId', device.id);
      }
    }
  })();
}
