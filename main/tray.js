'use strict';

const {Tray} = require('electron');
const path = require('path');

const {openCropperWindow} = require('./cropper');
const {cogMenu} = require('./menus');
const {track} = require('./common/analytics');
const openFiles = require('./utils/open-files');

let tray = null;

const openContextMenu = () => {
  tray.popUpContextMenu(cogMenu);
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
    setTimeout(() => {
      const number = String(i++).padStart(5, '0');
      const filename = `loading_${number}Template.png`;

      try {
        tray.setImage(path.join(__dirname, '..', 'static', 'menubar-loading', filename));
        next();
      } catch (_) {
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
