'use strict';
const {globalShortcut} = require('electron');
const ipc = require('electron-better-ipc');
const shortcutToAccelerator = require('../renderer/utils/shortcut-to-accelerator');
const store = require('./common/settings');
const {openCropperWindow} = require('./cropper');

const registerShortcut = shortcut => {
  try {
    const shortcutAccelerator = shortcutToAccelerator(shortcut);
    globalShortcut.register(shortcutAccelerator, openCropperWindow);
  } catch (error) {
    console.error('Error registering shortcut', shortcut);
  }
};

const registrerFromStore = () => {
  if (store.get('recordKeyboardShortcut')) {
    const cropperShortcut = store.get('cropperShortcut');
    if (cropperShortcut) {
      registerShortcut(cropperShortcut);
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
      registerShortcut(shortcut);
    }
  });

  // Register keyboard shortcuts from store
  registrerFromStore();
};
module.exports = {
  initializeGlobalAccelerators
};
