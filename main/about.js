const electron = require('electron');
const {is} = require('electron-util');
const {ipcMain: ipc} = require('electron-better-ipc');
const delay = require('delay');

const loadRoute = require('./utils/routes');
const {closeAllCroppers} = require('./cropper');

const {BrowserWindow} = electron;

let aboutWindow;

const openAboutWindow = () => {
  closeAllCroppers();

  if (aboutWindow) {
    aboutWindow.show();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 284,
    height: 200,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    title: '',
    center: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: !is.development // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
    },
    show: false
  });

  loadRoute(aboutWindow, 'about');

  ipc.answerRenderer('about-ready', async () => {
    await delay(100);
    aboutWindow.show();
  });

  aboutWindow.on('close', () => {
    aboutWindow = null;
  });
};

module.exports = {
  openAboutWindow
};
