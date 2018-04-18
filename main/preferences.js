// Native
const { format } = require('url');

// Packages
const { BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const { resolve } = require('app-root-path');


const devPath = 'http://localhost:8000/preferences'

const prodPath = format({
  pathname: resolve('renderer/out/preferences/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath

let prefsWindow = null;

const openPrefsWindow = () => {
  if (prefsWindow) {
    return prefsWindow.show();
  }

  prefsWindow = new BrowserWindow({
    width: 480,
    height: 480,
    resizable: false,
    minimizable: false,
    maximizable: false,
    titleBarStyle: 'hiddenInset',
    show: false
  });
  prefsWindow.setAlwaysOnTop(true, 'screen-saver', 1);

  prefsWindow.on('close', () => {
    prefsWindow = null;
  });

  prefsWindow.loadURL(url);
  prefsWindow.on('ready-to-show', prefsWindow.show);
};

module.exports = {
  openPrefsWindow
};
