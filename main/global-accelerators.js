'use strict';
const {globalShortcut} = require('electron');
const {ipcMain: ipc} = require('electron-better-ipc');
const shortcutToAccelerator = require('./utils/shortcut-to-accelerator');
const store = require('./common/settings');
const {openCropperWindow, isCropperOpen} = require('./cropper');

const openCropper = () => {
  if (!isCropperOpen()) {
    openCropperWindow();
  }
};

// All settings that should be loaded and handled as global accelerators
const handlers = new Map([
  ['cropperShortcut', openCropper]
]);

// If no action is passed, it resets
const setCropperShortcutAction = (action = openCropper) => {
  if (store.get('recordKeyboardShortcut') && store.has('cropperShortcut')) {
    handlers.set('cropperShortcut', action);

    const shortcut = shortcutToAccelerator(store.get('cropperShortcut'));
    if (globalShortcut.isRegistered(shortcut)) {
      globalShortcut.unregister(shortcut);
    }

    globalShortcut.register(shortcut, action);
  }
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
    for (const [setting, action] of handlers.entries()) {
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

    if (shortcut) {
      store.set(setting, shortcut);
      registerShortcut(shortcut, handlers.get(setting));
    } else {
      store.delete(setting);
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
  initializeGlobalAccelerators,
  setCropperShortcutAction
};
