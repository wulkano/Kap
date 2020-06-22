'use strict';

const {Tray} = require('electron');
const path = require('path');

const {openCropperWindow} = require('./cropper');
const {getCogMenu} = require('./menus');
const {track} = require('./common/analytics');
const openFiles = require('./utils/open-files');

let tray = null;
let trayAnimation = null;

const openContextMenu = () => {
  tray.popUpContextMenu(getCogMenu());
};

const initializeTray = () => {
  tray = new Tray(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
  tray.on('click', openCropperWindow);
  tray.on('right-click', openContextMenu);
  tray.on('drop-files', (_, files) => {
    track('editor/opened/tray');
    openFiles(...files);
  });

  return tray;
};

const disableTray = () => {
  tray.removeListener('click', openCropperWindow);
  tray.removeListener('right-click', openContextMenu);
};

const resetTray = () => {
  if (trayAnimation) {
    clearTimeout(trayAnimation);
  }

  tray.removeAllListeners('click');
  tray.setImage(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
  tray.on('click', openCropperWindow);
  tray.on('right-click', openContextMenu);
};

const setRecordingTray = stopRecording => {
  animateIcon();
  tray.once('click', stopRecording);
};

const animateIcon = () => new Promise(resolve => {
  const interval = 20;
  let i = 0;

  const next = () => {
    trayAnimation = setTimeout(() => {
      const number = String(i++).padStart(5, '0');
      const filename = `loading_${number}Template.png`;

      try {
        tray.setImage(path.join(__dirname, '..', 'static', 'menubar-loading', filename));
        next();
      } catch {
        trayAnimation = null;
        resolve();
      }
    }, interval);
  };

  next();
});

module.exports = {
  initializeTray,
  disableTray,
  setRecordingTray,
  resetTray
};
