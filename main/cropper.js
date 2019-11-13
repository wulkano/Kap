'use strict';

const electron = require('electron');
const delay = require('delay');

const settings = require('./common/settings');
const {hasMicrophoneAccess, ensureMicrophonePermissions, openSystemPreferences, ensureScreenCapturePermissions} = require('./common/system-permissions');
const loadRoute = require('./utils/routes');
const {checkForAnyBlockingEditors} = require('./editor');

const {BrowserWindow, systemPreferences, dialog} = electron;

const croppers = new Map();
let notificationId = null;

const closeAllCroppers = () => {
  const {screen} = electron;

  screen.removeAllListeners('display-removed');
  screen.removeAllListeners('display-added');

  for (const [id, cropper] of croppers) {
    cropper.destroy();
    croppers.delete(id);
  }

  if (notificationId !== null) {
    systemPreferences.unsubscribeWorkspaceNotification(notificationId);
    notificationId = null;
  }
};

const openCropper = (display, activeDisplayId) => {
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
    moveable: false,
    frame: false,
    transparent: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
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
      if (savedCropper.displayId === id) {
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
  if (checkForAnyBlockingEditors()) {
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
        openSystemPreferences();
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

  const {screen} = electron;
  const displays = screen.getAllDisplays();
  const activeDisplayId = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).id;

  for (const display of displays) {
    openCropper(display, activeDisplayId);
  }

  for (const cropper of croppers.values()) {
    cropper.showInactive();
  }

  croppers.get(activeDisplayId).focus();
  notificationId = systemPreferences.subscribeWorkspaceNotification('NSWorkspaceActiveSpaceDidChangeNotification', () => {
    closeAllCroppers();
  });

  screen.on('display-removed', (event, oldDisplay) => {
    const {id} = oldDisplay;
    const cropper = croppers.get(id);

    const wasFocused = cropper.isFocused();

    cropper.removeAllListeners('closed');
    cropper.destroy();
    croppers.delete(id);

    if (wasFocused) {
      const activeDisplayId = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).id;
      if (croppers.has(activeDisplayId)) {
        croppers.get(activeDisplayId).focus();
      }
    }
  });

  screen.on('display-added', (event, newDisplay) => {
    const cropper = openCropper(newDisplay);
    cropper.showInactive();
  });
};

const preventDefault = event => event.preventDefault();

const selectApp = async (window, activateWindow) => {
  for (const cropper of croppers.values()) {
    cropper.prependListener('blur', preventDefault);
  }

  await activateWindow(window.ownerName);

  const {screen} = electron;
  const {x, y, width, height, ownerName} = window;

  const display = screen.getDisplayMatching({x, y, width, height});
  const {id, bounds: {x: screenX, y: screenY}} = display;

  // For some reason this happened a bit too early without the timeout
  await delay(300);

  for (const cropper of croppers.values()) {
    cropper.removeListener('blur', preventDefault);
    cropper.webContents.send('blur');
  }

  croppers.get(id).focus();

  croppers.get(id).webContents.send('select-app', {
    ownerName,
    x: x - screenX,
    y: y - screenY,
    width,
    height
  });
};

const disableCroppers = () => {
  if (notificationId !== null) {
    systemPreferences.unsubscribeWorkspaceNotification(notificationId);
    notificationId = null;
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

const isCropperOpen = () => croppers.size > 0;

module.exports = {
  openCropperWindow,
  closeAllCroppers,
  selectApp,
  setRecordingCroppers,
  disableCroppers,
  isCropperOpen
};
