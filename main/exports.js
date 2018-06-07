'use strict';

const {format: formatUrl} = require('url');
const {BrowserWindow, app} = require('electron');
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

const openExportsWindow = show => {
  if (!exportsWindow) {
    exportsWindow = new BrowserWindow({
      width: 320,
      height: 360,
      resizable: false,
      minimizable: false,
      maximizable: false,
      titleBarStyle: 'hiddenInset',
      show
    });

    if (isDev) {
      exportsWindow.openDevTools({mode: 'detach'});
    }

    exportsWindow.loadURL(url);

    exportsWindow.on('close', event => {
      event.preventDefault();
      exportsWindow.hide();
    });

    exportsWindow.on('closed', () => {
      exportsWindow = null;
    });
  }
};

const getExportsWindow = () => exportsWindow;

const showExportsWindow = () => {
  if (exportsWindow && !exportsWindow.isVisible()) {
    exportsWindow.show();
  } else {
    openExportsWindow(true);
  }
};

app.on('before-quit', () => {
  if (exportsWindow) {
    exportsWindow.removeAllListeners('close');
  }
});

module.exports = {
  openExportsWindow,
  getExportsWindow,
  showExportsWindow
};
