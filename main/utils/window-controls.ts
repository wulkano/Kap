import {ipcMain} from 'electron-better-ipc';
import {BrowserWindow, systemPreferences} from 'electron/main';

export function initializeWindowControls() {
  ipcMain.answerRenderer('get-window-info', async (_, window) => {
    return {
      closable: window.isClosable(),
      minimizable: window.isMinimizable(),
      maximizable: window.isMaximizable()
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
}
