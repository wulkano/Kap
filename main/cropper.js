// Native
const { format } = require('url');

// Packages
const { BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const { resolve } = require('app-root-path');


const devPath = 'http://localhost:8000/cropper'

const prodPath = format({
  pathname: resolve('renderer/out/cropper/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath

let cropper = null;

const openCropperWindow = () => {
  if (!cropper) {
    let {width, height} = require('electron').screen.getPrimaryDisplay().bounds;
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
      transparent: true,
    });
    console.log(require('electron').screen.getPrimaryDisplay().bounds);

    cropper.setAlwaysOnTop(true, 'screen-saver', 1);
    // cropper.focus();
    cropper.on('ready', cropper.focus);

    // cropper.setIgnoreMouseEvents(true);
    //
    if (isDev) {
      cropper.openDevTools({mode: 'detach'});
    }

    cropper.loadURL(url)
    cropper.on('blur', () => {
      if(!cropper.webContents.isDevToolsFocused()) {
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
