// Native
const {format} = require('url');

// Packages
const {BrowserWindow} = require('electron');
const isDev = require('electron-is-dev');
const {resolve} = require('app-root-path');

const devPath = 'http://localhost:8000/cropper';

const prodPath = format({
  pathname: resolve('renderer/out/cropper/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath;

let cropper = null;

const openCropperWindow = () => {
  if (!cropper) {
    const {width, height} = require('electron').screen.getPrimaryDisplay().bounds;
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

    cropper.loadURL(url);
    cropper.setAlwaysOnTop(true, 'screen-saver', 1);
    cropper.on('ready', cropper.focus);

    // if (isDev) {
    //   cropper.openDevTools({mode: 'detach'});
    // }

    cropper.on('blur', () => {
      if (!cropper.webContents.isDevToolsFocused()) {
        cropper.close();
      }
    });

    cropper.on('closed', () => {
      cropper = null;
    });
  }
};

module.exports = {
  openCropperWindow
};
