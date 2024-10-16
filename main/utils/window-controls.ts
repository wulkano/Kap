import {ipcMain} from 'electron-better-ipc';
import {BrowserWindow, dialog, MessageBoxOptions, nativeTheme, systemPreferences} from 'electron/main';
import {systemColorNames} from '../common/system-colors';

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

  ipcMain.answerRenderer('get-system-colors', async () => {
    return {
      accentColor: systemPreferences.getAccentColor(),
      colors: Object.fromEntries(systemColorNames.map(name => [
        name,
        systemPreferences.getColor(name)
      ]))
    };
  });

  systemPreferences.on('accent-color-changed', (_, newColor) => {
    for (const window of BrowserWindow.getAllWindows()) {
      ipcMain.callRenderer(window, 'accent-color-changed', newColor);
    }
  });

  ipcMain.answerRenderer('get-dark-mode', async () => {
    return nativeTheme.shouldUseDarkColors;
  });

  nativeTheme.on('updated', () => {
    for (const window of BrowserWindow.getAllWindows()) {
      ipcMain.callRenderer(window, 'dark-mode-changed', nativeTheme.shouldUseDarkColors);
    }
  });
}
