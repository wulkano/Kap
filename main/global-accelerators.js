'use strict';
const {globalShortcut} = require('electron');
const ipc = require('electron-better-ipc');
const shortcutToAccelerator = require('./utils/shortcut-to-accelerator');
const store = require('./common/settings');
const {openCropperWindow} = require('./cropper');

// All settings that should be loaded and handled as global accelerators
const handlers = {
  cropperShortcut: openCropperWindow
};

const registerShortcut = (shortcut, action) => {
  try {
    const shortcutAccelerator = shortcutToAccelerator(shortcut);
    globalShortcut.register(shortcutAccelerator, action);
  } catch (error) {
    console.error('Error registering shortcut', shortcut, action, error);
  }
};

const registrerFromStore = () => {
  if (store.get('recordKeyboardShortcut')) {
    for (const [setting, action] of Object.entries(handlers)) {
      const shortcut = store.get(setting);
      if (shortcut) {
        registerShortcut(shortcut, action);
      }
    }
  } else {
    globalShortcut.unregisterAll();
  }
};

const initializeGlobalAccelerators = () => {
  ipc.answerRenderer('update-shortcut', ({setting, shortcut}) => {
    try {
      if (store.has(setting)) {
        const oldShortcut = store.get(setting);
        const shortcutAccelerator = shortcutToAccelerator(oldShortcut);
        if (globalShortcut.isRegistered(shortcutAccelerator)) {
          globalShortcut.unregister(shortcutAccelerator);
        }
      }
    } catch (error) {
      console.error('Error unregestering old shortcutAccelerator', error);
    }

    store.set(setting, shortcut);

    if (shortcut) {
      registerShortcut(shortcut, handlers[setting]);
    }
  });

  ipc.answerRenderer('toggle-shortcuts', ({enabled}) => {
    if (enabled) {
      registrerFromStore();
    } else {
      globalShortcut.unregisterAll();
    }
  });

  // Register keyboard shortcuts from store
  registrerFromStore();
};

module.exports = {
  initializeGlobalAccelerators
};
