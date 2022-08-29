'use strict';

import {Tray} from 'electron';
import {KeyboardEvent} from 'electron/main';
import path from 'path';
import {getCogMenu} from './menus/cog';
import {getRecordMenu} from './menus/record';
import {track} from './common/analytics';
import {openFiles} from './utils/open-files';
import {windowManager} from './windows/manager';
import {pauseRecording, resumeRecording, stopRecording} from './aperture';

let tray: Tray;
let trayAnimation: NodeJS.Timeout | undefined;

const openContextMenu = async () => {
  tray.popUpContextMenu(await getCogMenu());
};

const openRecordingContextMenu = async () => {
  tray.popUpContextMenu(await getRecordMenu(false));
};

const openPausedContextMenu = async () => {
  tray.popUpContextMenu(await getRecordMenu(true));
};

const openCropperWindow = () => windowManager.cropper?.open();

export const initializeTray = () => {
  tray = new Tray(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
  tray.on('click', openCropperWindow);
  tray.on('right-click', openContextMenu);
  tray.on('drop-files', (_, files) => {
    track('editor/opened/tray');
    openFiles(...files);
  });

  return tray;
};

export const disableTray = () => {
  tray.removeListener('click', openCropperWindow);
  tray.removeListener('right-click', openContextMenu);
};

export const resetTray = () => {
  if (trayAnimation) {
    clearTimeout(trayAnimation);
  }

  tray.removeAllListeners('click');
  tray.removeAllListeners('right-click');

  tray.setImage(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
  tray.on('click', openCropperWindow);
  tray.on('right-click', openContextMenu);
};

export const setRecordingTray = () => {
  animateIcon();

  tray.removeAllListeners('right-click');

  // TODO: figure out why this is marked as missing. It's defined properly in the electron.d.ts file
  tray.once('click', onRecordingTrayClick);
  tray.on('right-click', openRecordingContextMenu);
};

export const setPausedTray = () => {
  if (trayAnimation) {
    clearTimeout(trayAnimation);
  }

  tray.removeAllListeners('right-click');

  tray.setImage(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
  tray.once('click', resumeRecording);
  tray.on('right-click', openPausedContextMenu);
};

const onRecordingTrayClick = (event: KeyboardEvent) => {
  if (event.altKey) {
    pauseRecording();
    return;
  }

  stopRecording();
};

const animateIcon = async () => new Promise<void>(resolve => {
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
        trayAnimation = undefined;
        resolve();
      }
    }, interval);
  };

  next();
});
