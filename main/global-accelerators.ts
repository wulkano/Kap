import {globalShortcut} from 'electron';
import {ipcMain as ipc} from 'electron-better-ipc';
import {settings} from './common/settings';
import {windowManager} from './windows/manager';

const openCropper = () => {
  if (!windowManager.cropper?.isOpen()) {
    windowManager.cropper?.open();
  }
};

// All settings that should be loaded and handled as global accelerators
const handlers = new Map<string, () => void>([
  ['triggerCropper', openCropper]
]);

// If no action is passed, it resets
export const setCropperShortcutAction = (action = openCropper) => {
  if (settings.get('enableShortcuts') && settings.get('shortcuts.triggerCropper')) {
    handlers.set('cropperShortcut', action);

    const shortcut = settings.get<string, string>('shortcuts.triggerCropper');
    if (globalShortcut.isRegistered(shortcut)) {
      globalShortcut.unregister(shortcut);
    }

    globalShortcut.register(shortcut, action);
  }
};

const registerShortcut = (shortcut: string, action: () => void) => {
  try {
    globalShortcut.register(shortcut, action);
  } catch (error) {
    console.error('Error registering shortcut', shortcut, action, error);
  }
};

const registerFromStore = () => {
  if (settings.get('enableShortcuts')) {
    for (const [setting, action] of handlers.entries()) {
      const shortcut = settings.get<string, string>(`shortcuts.${setting}`);
      if (shortcut) {
        registerShortcut(shortcut, action);
      }
    }
  } else {
    globalShortcut.unregisterAll();
  }
};

export const initializeGlobalAccelerators = () => {
  ipc.answerRenderer('update-shortcut', ({setting, shortcut}) => {
    const oldShortcut = settings.get<string, string>(`shortcuts.${setting}`);

    try {
      if (oldShortcut && oldShortcut !== shortcut && globalShortcut.isRegistered(oldShortcut)) {
        globalShortcut.unregister(oldShortcut);
      }
    } catch (error) {
      console.error('Error unregistering old shortcutAccelerator', error);
    } finally {
      if (shortcut && shortcut !== oldShortcut) {
        settings.set(`shortcuts.${setting}`, shortcut);
        const handler = handlers.get(setting);

        if (settings.get('enableShortcuts') && handler) {
          registerShortcut(shortcut, handler);
        }
      } else if (!shortcut) {
        // @ts-expect-error
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
