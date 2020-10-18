'use strict';

import {homedir} from 'os';
import Store from 'electron-store';

const {defaultInputDeviceId} = require('./constants');
const {hasMicrophoneAccess} = require('./system-permissions');
const {getAudioDevices, getDefaultInputDevice} = require('../utils/devices');
const shortcutToAccelerator = require('../utils/shortcut-to-accelerator');

export const shortcuts = {
  triggerCropper: 'Toggle Kap',
};

const shortcutSchema = {
  type: 'string',
  default: ''
};

interface Settings {
  kapturesDir: string;
  allowAnalytics: boolean;
  showCursor: boolean;
  highlightClicks: boolean;
  record60fps: boolean;
  loopExports: boolean;
  recordKeyboardShortcut: boolean;
  recordAudio: boolean;
  audioInputDeviceId?: string;
  cropperShortcut: {
    metaKey: boolean,
    altKey: boolean,
    ctrlKey: boolean,
    shiftKey: boolean,
    character: string
  };
  lossyCompression: boolean;
  enableShortcuts: boolean;
  shortcuts: {
    [key in keyof typeof shortcuts]: string
  }
}

const store = new Store<Settings>({
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
      properties: Object.keys(shortcuts).reduce((acc, key) => ({...acc, [key]: shortcutSchema}), {}),
      default: {}
    },
    version: {
      type: 'string',
      default: ''
    }
  }
});

export default store;

// TODO: Remove this when we feel like everyone has migrated
if (store.has('recordKeyboardShortcut')) {
  store.set('enableShortcuts', store.get('recordKeyboardShortcut'));
  store.delete('recordKeyboardShortcut');
}

// TODO: Remove this when we feel like everyone has migrated
if (store.has('cropperShortcut')) {
  // TODO: Investigate type for dot notation
  store.set('shortcuts.triggerCropper' as any, shortcutToAccelerator(store.get('cropperShortcut')));
  store.delete('cropperShortcut');
}

store.set('cropper' as any, {});
store.set('actionBar' as any, {});

const audioInputDeviceId = store.get('audioInputDeviceId');

if (hasMicrophoneAccess()) {
  (async () => {
    const devices = await getAudioDevices();

    if (!devices.some((device: any) => device.id === audioInputDeviceId)) {
      store.set('audioInputDeviceId', defaultInputDeviceId);
    }
  })();
}

export const getSelectedInputDeviceId = () => {
  const audioInputDeviceId = store.get('audioInputDeviceId', defaultInputDeviceId);

  if (audioInputDeviceId === defaultInputDeviceId) {
    const device = getDefaultInputDevice();
    return device && device.id;
  }

  return audioInputDeviceId;
};
