
import {windowManager} from './manager';
import {BrowserWindow, systemPreferences, dialog, screen, Display, app} from 'electron';
import delay from 'delay';

import {settings} from '../common/settings';
import {hasMicrophoneAccess, ensureMicrophonePermissions, openSystemPreferences, ensureScreenCapturePermissions} from '../common/system-permissions';
import {loadRoute} from '../utils/routes';
import {MacWindow} from '../utils/windows';

const croppers = new Map<number, BrowserWindow>();
let notificationId: number | undefined;
let isOpen = false;

const closeAllCroppers = () => {
  screen.removeAllListeners('display-removed');
  screen.removeAllListeners('display-added');

  for (const [id, cropper] of croppers) {
    cropper.destroy();
    croppers.delete(id);
  }

  isOpen = false;

  if (notificationId !== undefined) {
    systemPreferences.unsubscribeWorkspaceNotification(notificationId);
    notificationId = undefined;
  }
};

const openCropper = (display: Display, activeDisplayId?: number) => {
  const {id, bounds} = display;
  const {x, y, width, height} = bounds;

  const cropper = new BrowserWindow({
    x,
    y,
    width,
    height,
    hasShadow: false,
    enableLargerThanScreen: true,
    resizable: false,
    movable: false,
    frame: false,
    transparent: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  loadRoute(cropper, 'cropper');

  cropper.setAlwaysOnTop(true, 'screen-saver', 1);

  cropper.webContents.on('did-finish-load', () => {
    const isActive = activeDisplayId === id;
    const displayInfo = {
      isActive,
      id,
      x,
      y,
      width,
      height
    };

    if (isActive) {
      const savedCropper = settings.get('cropper', {});
      // @ts-expect-error
      if (savedCropper.displayId === id) {
        // @ts-expect-error
        displayInfo.cropper = savedCropper;
      }
    }

    cropper.webContents.send('display', displayInfo);
  });

  cropper.on('closed', closeAllCroppers);
  croppers.set(id, cropper);
  return cropper;
};

const openCropperWindow = async () => {
  closeAllCroppers();
  if (windowManager.editor?.areAnyBlocking()) {
    return;
  }

  if (!ensureScreenCapturePermissions()) {
    return;
  }

  const recordAudio = settings.get('recordAudio');

  if (recordAudio && !hasMicrophoneAccess()) {
    const granted = await ensureMicrophonePermissions(async () => {
      const {response} = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Open System Preferences', 'Continue'],
        defaultId: 1,
        message: 'Kap cannot access the microphone.',
        detail: 'Audio recording is enabled but Kap does not have access to the microphone. Continue without audio or grant Kap access to the microphone the System Preferences.',
        cancelId: 2
      });

      if (response === 0) {
        openSystemPreferences('Privacy_Microphone');
        return false;
      }

      if (response === 1) {
        settings.set('recordAudio', false);
        return true;
      }

      return false;
    });

    if (!granted) {
      return;
    }
  }

  isOpen = true;

  const displays = screen.getAllDisplays();
  const activeDisplayId = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).id;

  for (const display of displays) {
    openCropper(display, activeDisplayId);
  }

  for (const cropper of croppers.values()) {
    cropper.showInactive();
  }

  croppers.get(activeDisplayId)?.focus();

  // Electron typing issue, this should be marked as returning a number
  notificationId = (systemPreferences as any).subscribeWorkspaceNotification('NSWorkspaceActiveSpaceDidChangeNotification', () => {
    closeAllCroppers();
  });

  screen.on('display-removed', (_, oldDisplay) => {
    const {id} = oldDisplay;
    const cropper = croppers.get(id);

    if (!cropper) {
      return;
    }

    const wasFocused = cropper.isFocused();

    cropper.removeAllListeners('closed');
    cropper.destroy();
    croppers.delete(id);

    if (wasFocused) {
      const activeDisplayId = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).id;
      if (croppers.has(activeDisplayId)) {
        croppers.get(activeDisplayId)?.focus();
      }
    }
  });

  screen.on('display-added', (_, newDisplay) => {
    const cropper = openCropper(newDisplay);
    cropper.showInactive();
  });
};

const preventDefault = (event: any) => event.preventDefault();

const selectApp = async (window: MacWindow, activateWindow: (ownerName: string) => Promise<void>) => {
  for (const cropper of croppers.values()) {
    cropper.prependListener('blur', preventDefault);
  }

  await activateWindow(window.ownerName);

  const {x, y, width, height, ownerName} = window;

  const display = screen.getDisplayMatching({x, y, width, height});
  const {id, bounds: {x: screenX, y: screenY}} = display;

  // For some reason this happened a bit too early without the timeout
  await delay(300);

  for (const cropper of croppers.values()) {
    cropper.removeListener('blur', preventDefault);
    cropper.webContents.send('blur');
  }

  croppers.get(id)?.focus();

  croppers.get(id)?.webContents.send('select-app', {
    ownerName,
    x: x - screenX,
    y: y - screenY,
    width,
    height
  });
};

const disableCroppers = () => {
  if (notificationId !== undefined) {
    systemPreferences.unsubscribeWorkspaceNotification(notificationId);
    notificationId = undefined;
  }

  for (const cropper of croppers.values()) {
    cropper.removeAllListeners('blur');
    cropper.setIgnoreMouseEvents(true);
    cropper.setVisibleOnAllWorkspaces(true);
  }
};

const setRecordingCroppers = () => {
  for (const cropper of croppers.values()) {
    cropper.webContents.send('start-recording');
  }
};

const isCropperOpen = () => isOpen;

app.on('before-quit', closeAllCroppers);

app.on('browser-window-created', () => {
  if (!isCropperOpen()) {
    app.dock.show();
  }
});

windowManager.setCropper({
  open: openCropperWindow,
  close: closeAllCroppers,
  selectApp,
  setRecording: setRecordingCroppers,
  isOpen: isCropperOpen,
  disable: disableCroppers
});
