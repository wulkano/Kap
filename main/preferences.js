'use strict';

const {format: formatUrl} = require('url');
const {BrowserWindow} = require('electron');
const isDev = require('electron-is-dev');
const {resolve} = require('app-root-path');

const devPath = 'http://localhost:8000/preferences';

const prodPath = formatUrl({
  pathname: resolve('renderer/out/preferences/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath;

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

  prefsWindow.on('close', () => {
    prefsWindow = null;
  });

  if (isDev) {
    prefsWindow.openDevTools({mode: 'detach'});
  }

  prefsWindow.loadURL(url);
  prefsWindow.on('ready-to-show', prefsWindow.show);
};

module.exports = {
  openPrefsWindow
};
