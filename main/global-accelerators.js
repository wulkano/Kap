'use strict';
const {globalShortcut} = require('electron');
const {ipcMain: ipc} = require('electron-better-ipc');
const settings = require('./common/settings').default;
const {openCropperWindow, isCropperOpen} = require('./cropper');

const openCropper = () => {
  if (!isCropperOpen()) {
    openCropperWindow();
  }
};

// All settings that should be loaded and handled as global accelerators
const handlers = new Map([
  ['triggerCropper', openCropper]
]);

// If no action is passed, it resets
const setCropperShortcutAction = (action = openCropper) => {
  if (settings.get('enableShortcuts') && settings.get('shortcuts.triggerCropper')) {
    handlers.set('cropperShortcut', action);

    const shortcut = settings.get('shortcuts.triggerCropper');
    if (globalShortcut.isRegistered(shortcut)) {
      globalShortcut.unregister(shortcut);
    }

    globalShortcut.register(shortcut, action);
  }
};

const registerShortcut = (shortcut, action) => {
  try {
    globalShortcut.register(shortcut, action);
  } catch (error) {
    console.error('Error registering shortcut', shortcut, action, error);
  }
};

const registerFromStore = () => {
  if (settings.get('enableShortcuts')) {
    for (const [setting, action] of handlers.entries()) {
      const shortcut = settings.get(`shortcuts.${setting}`);
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
    const oldShortcut = settings.get(`shortcuts.${setting}`);

    try {
      if (oldShortcut && oldShortcut !== shortcut && globalShortcut.isRegistered(oldShortcut)) {
        globalShortcut.unregister(oldShortcut);
      }
    } catch (error) {
      console.error('Error unregistering old shortcutAccelerator', error);
    } finally {
      if (shortcut && shortcut !== oldShortcut) {
        settings.set(`shortcuts.${setting}`, shortcut);

        if (settings.get('enableShortcuts')) {
          registerShortcut(shortcut, handlers.get(setting));
        }
      } else if (!shortcut) {
        settings.delete(`shortcuts.${setting}`);
      }
    }
  });

  ipc.answerRenderer('toggle-shortcuts', ({enabled}) => {
    if (enabled) {
      registerFromStore();
    } else {
      globalShortcut.unregisterAll();
    }
  });

  // Register keyboard shortcuts from store
  registerFromStore();
};

module.exports = {
  initializeGlobalAccelerators,
  setCropperShortcutAction
};
