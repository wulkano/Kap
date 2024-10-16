import {ipcMain} from 'electron-better-ipc';
import {BrowserWindow, dialog, MessageBoxOptions, systemPreferences} from 'electron/main';

export function initializeWindowControls() {
  ipcMain.answerRenderer('get-window-info', async (_, window) => {
    return {
      closable: window.isClosable(),
      minimizable: window.isMinimizable(),
      maximizable: window.isMaximizable(),
      isFocused: window.isFocused()
    };
  });

  ipcMain.answerRenderer<'close' | 'minimize' | 'toggle-fullscreen'>('window-action', async (action, window) => {
    if (action === 'close') {
      window.close();
    } else if (action === 'minimize') {
      window.minimize();
    } else if (action === 'toggle-fullscreen') {
      window.setFullScreen(!window.isFullScreen());
    }
  });

  systemPreferences.subscribeLocalNotification('AppleAquaColorVariantChanged', () => {
    for (const window of BrowserWindow.getAllWindows()) {
      ipcMain.callRenderer(window, 'window-tint-changed', systemPreferences.getUserDefault('AppleAquaColorVariant', 'string'));
    }
  });

  ipcMain.answerRenderer('focus-events', async (_, window) => {
    const onFocus = () => {
      ipcMain.callRenderer(window, 'window-focus');
    };

    const onBlur = () => {
      ipcMain.callRenderer(window, 'window-blur');
    };

    window.on('focus', onFocus);
    window.on('blur', onBlur);

    const cleanup = ipcMain.answerRenderer('stop-focus-events', async (_, cleanupWindow) => {
      if (window.id === cleanupWindow.id) {
        window.removeListener('focus', onFocus);
        window.removeListener('blur', onBlur);
        cleanup();
      }
    });
  });

  ipcMain.answerRenderer<MessageBoxOptions>('show-dialog', async (args, window) => {
    return dialog.showMessageBox(window, args);
  });
}
