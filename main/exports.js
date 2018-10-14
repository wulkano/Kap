'use strict';

const {BrowserWindow, app} = require('electron');
const loadRoute = require('./utils/routes');

let exportsWindow = null;

const openExportsWindow = show => {
  if (!exportsWindow) {
    exportsWindow = new BrowserWindow({
      width: 320,
      height: 360,
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      titleBarStyle: 'hiddenInset',
      show
    });

    const titlebarHeight = 37;
    exportsWindow.setSheetOffset(titlebarHeight);

    loadRoute(exportsWindow, 'exports');

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
  if (!exportsWindow) {
    openExportsWindow(true);
  }

  if (exportsWindow.isVisible()) {
    exportsWindow.focus();
  } else {
    exportsWindow.show();
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
