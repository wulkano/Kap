'use strict';

const {homedir} = require('os');
const Store = require('electron-store');

const {audioDevices} = require('aperture');

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
    hideDesktopIcons: {
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
    doNotDisturb: {
      type: 'boolean',
      default: false
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

store.set('cropper', {});
store.set('actionBar', {});

const audioInputDeviceId = store.get('audioInputDeviceId');

(async () => {
  const devices = await audioDevices();

  if (devices && !devices.some(device => device.id === audioInputDeviceId)) {
    const [device] = devices;
    if (device) {
      store.set('audioInputDeviceId', device.id);
    }
  }
})();

module.exports = store;
