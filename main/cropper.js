'use strict';

const {format: formatUrl} = require('url');
const electron = require('electron');
const isDev = require('electron-is-dev');
const {resolve} = require('app-root-path');

const {BrowserWindow} = electron;
const devPath = 'http://localhost:8000/cropper';

const prodPath = formatUrl({
  pathname: resolve('renderer/out/cropper/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath;

let cropper = null;
let shouldIgnoreBlur = false;

const openCropperWindow = () => {
  if (cropper) {
    cropper.setIgnoreMouseEvents(false);
    cropper.show();
  } else {
    const {width, height} = electron.screen.getPrimaryDisplay().bounds;
    global.screen = {width, height};
    cropper = new BrowserWindow({
      x: 0,
      y: 0,
      width,
      height,
      hasShadow: false,
      enableLargerThanScreen: true,
      resizable: false,
      moveable: false,
      frame: false,
      transparent: true
    });

    // cropper.setIgnoreMouseEvents(true);
    cropper.loadURL(url);
    cropper.setAlwaysOnTop(true, 'screen-saver', 1);
    cropper.on('ready', cropper.focus);

    if (isDev) {
      cropper.openDevTools({mode: 'detach'});
    }

    cropper.on('blur', () => {
      if (!shouldIgnoreBlur && !cropper.webContents.isDevToolsFocused()) {
        cropper.close();
      }
    });

    cropper.on('closed', () => {
      cropper = null;
    });
  }
};

const ignoreBlur = () => {
  shouldIgnoreBlur = true;
};

const restoreBlur = () => {
  shouldIgnoreBlur = false;
  cropper.focus();
};

const closeCropperWindow = () => {
  cropper.close();
};

module.exports = {
  openCropperWindow,
  closeCropperWindow,
  ignoreBlur,
  restoreBlur
};
