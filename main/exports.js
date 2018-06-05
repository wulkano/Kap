'use strict';

const {format: formatUrl} = require('url');
const {BrowserWindow} = require('electron');
const isDev = require('electron-is-dev');
const {resolve} = require('app-root-path');

const devPath = 'http://localhost:8000/exports';

const prodPath = formatUrl({
  pathname: resolve('renderer/out/exports/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath;

let exportsWindow = null;

const openExportsWindow = () => {
  if (!exportsWindow) {
    exportsWindow = new BrowserWindow({
      width: 320,
      height: 360,
      alwaysOnTop: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        webSecurity: !isDev // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
      },
    });

    if (isDev) {
      exportsWindow.openDevTools({mode: 'detach'});
    }

    exportsWindow.loadURL(url);
    exportsWindow.on('closed', () => {
      exportsWindow = null;
    });
  }
};

const getExportsWindow = () => exportsWindow;

module.exports = {
  openExportsWindow,
  getExportsWindow
};
