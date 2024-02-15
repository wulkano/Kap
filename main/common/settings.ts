'use strict';

import {homedir} from 'os';
import Store from 'electron-store';

const {defaultInputDeviceId} = require('./constants');
const shortcutToAccelerator = require('../utils/shortcut-to-accelerator');

export const shortcuts = {
  triggerCropper: 'Toggle Kap'
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
    metaKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    character: string;
  };
  lossyCompression: boolean;
  enableShortcuts: boolean;
  shortcuts: {
    [key in keyof typeof shortcuts]: string
  };
  version: string;
  showDiscardWarning: boolean;
}

export const settings = new Store<Settings>({
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
      // eslint-disable-next-line unicorn/no-array-reduce
      properties: Object.keys(shortcuts).reduce((acc, key) => ({...acc, [key]: shortcutSchema}), {}),
      default: {}
    },
    version: {
      type: 'string',
      default: ''
    },
    showDiscardWarning: {
      type: 'boolean',
      default: true
    }
  }
});

// TODO: Remove this when we feel like everyone has migrated
if (settings.has('recordKeyboardShortcut')) {
  settings.set('enableShortcuts', settings.get('recordKeyboardShortcut'));
  settings.delete('recordKeyboardShortcut');
}

// TODO: Remove this when we feel like everyone has migrated
if (settings.has('cropperShortcut')) {
  settings.set('shortcuts.triggerCropper', shortcutToAccelerator(settings.get('cropperShortcut')));
  settings.delete('cropperShortcut');
}

settings.set('cropper' as any, {});
settings.set('actionBar' as any, {});
