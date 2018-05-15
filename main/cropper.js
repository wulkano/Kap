'use strict';

const {format: formatUrl} = require('url');
const electron = require('electron');
const isDev = require('electron-is-dev');
const {resolve} = require('app-root-path');

const settings = require('./common/settings');

const {BrowserWindow} = electron;
const devPath = 'http://localhost:8000/cropper';

const prodPath = formatUrl({
  pathname: resolve('renderer/out/cropper/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath;

const croppers = new Map();

const closeAllCroppers = () => {
  const {screen} = electron;

  for (const [id, cropper] of croppers) {
    cropper.destroy();
    croppers.delete(id);
  }

  screen.removeAllListeners('display-removed');
  screen.removeAllListeners('display-added');
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
    show: false
  });

  cropper.loadURL(url);
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
      const savedCropper = settings.get('cropper');
      if (savedCropper.displayId === id) {
        displayInfo.cropper = savedCropper;
      }
    }

    cropper.webContents.send('display', displayInfo);
  });

  if (isDev) {
    cropper.openDevTools({mode: 'detach'});
  }

  cropper.on('closed', closeAllCroppers);
  croppers.set(id, cropper);
  return cropper;
};

const openCropperWindow = () => {
  closeAllCroppers();

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

  screen.on('display-removed', (event, oldDisplay) => {
    const {id} = oldDisplay;
    const cropper = croppers.get(id);

    const wasFocused = cropper.isFocused();

    cropper.removeAllListeners('closed');
    cropper.destroy();
    delete croppers[id];

    if (wasFocused) {
      const activeDisplayId = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).id;
      croppers.get(activeDisplayId).focus();
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
  setTimeout(() => {
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
  }, 300);
};

const closeCropperWindow = () => {
  closeAllCroppers();
};

module.exports = {
  openCropperWindow,
  closeCropperWindow,
  selectApp
};
