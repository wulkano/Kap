'use strict';

const {Tray} = require('electron');
const path = require('path');
const parseMilliseconds = require('parse-ms');

const {openCropperWindow} = require('./cropper');
const {cogMenu} = require('./menus');
const {track} = require('./common/analytics');
const openFiles = require('./utils/open-files');

let tray = null;
let trayAnimation = null;
let trayTimerTimeout = null;

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
  if (trayAnimation) {
    clearTimeout(trayAnimation);
  }

  clearTimeout(trayTimerTimeout);
  tray.setTitle('');

  tray.removeAllListeners('click');
  tray.setImage(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
  tray.on('click', openCropperWindow);
  tray.on('right-click', openContextMenu);
};

const setRecordingTray = stopRecording => {
  animateIcon();
  showTimeRecorded();
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
      } catch (_) {
        trayAnimation = null;
        resolve();
      }
    }, interval);
  };

  next();
});

const padNumber = (num, char = '0') => `${char}${num}`.slice(-2);

const showTimeRecorded = () => {
  let trayTimer = 0;
  const interval = 1000;

  const tick = () => {
    const {hours, minutes, seconds} = parseMilliseconds(trayTimer);
    if (hours) {
      tray.setTitle(` ${padNumber(hours, ' ')}:${padNumber(minutes)}:${padNumber(seconds)}`);
    } else {
      tray.setTitle(` ${padNumber(minutes)}:${padNumber(seconds)}`);
    }

    trayTimerTimeout = setTimeout(() => {
      trayTimer += interval;
      tick();
    }, interval);
  };

  tick();
};

module.exports = {
  initializeTray,
  disableTray,
  setRecordingTray,
  resetTray
};
