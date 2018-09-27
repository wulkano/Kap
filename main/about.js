const electron = require('electron');
const {is} = require('electron-util');
const ipc = require('electron-better-ipc');

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
    width: 280,
    height: 200,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    title: '',
    center: true,
    webPreferences: {
      webSecurity: !is.development // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
    },
    show: false
  });

  loadRoute(aboutWindow, 'about');

  ipc.answerRenderer('about-ready', () => aboutWindow.show());

  aboutWindow.on('close', () => {
    aboutWindow = null;
  });
};

module.exports = {
  openAboutWindow
};
