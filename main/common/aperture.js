'use strict';

const {dialog} = require('electron');
const desktopIcons = require('hide-desktop-icons');
const dnd = require('@sindresorhus/do-not-disturb');
const createAperture = require('aperture');

const {openEditorWindow} = require('../editor');
const {setRecordingTray, disableTray} = require('../tray');
const {setRecordingCroppers, closeAllCroppers} = require('../cropper');
const settings = require('./settings');

const aperture = createAperture();
const {audioDevices} = createAperture;

let wasDoNotDisturbAlreadyEnabled;
let lastRecordedFps;

const startRecording = async options => {
  const {cropperBounds, screenBounds, displayId} = options;
  const past = Date.now();

  cropperBounds.y = screenBounds.height - (cropperBounds.y + cropperBounds.height);

  const {
    record60fps,
    showCursor,
    highlightClicks,
    recordAudio,
    audioInputDeviceId,
    hideDesktopIcons,
    doNotDisturb
  } = settings.store;

  const apertureOpts = {
    fps: record60fps ? 60 : 30,
    cropArea: cropperBounds,
    showCursor,
    highlightClicks,
    displayId: String(displayId)
  };

  lastRecordedFps = apertureOpts.fps;

  disableTray();
  setRecordingCroppers();

  if (recordAudio === true) {
    // In case for some reason the default audio device is not set
    // use the first available device for recording
    if (audioInputDeviceId) {
      apertureOpts.audioDeviceId = audioInputDeviceId;
    } else {
      const [defaultAudioDevice] = await audioDevices();
      apertureOpts.audioDeviceId = defaultAudioDevice && defaultAudioDevice.id;
    }
  }

  console.log(`1 after ${(Date.now() - past) / 1000}s`);

  if (hideDesktopIcons) {
    await desktopIcons.hide();
  }

  console.log(`2 after ${(Date.now() - past) / 1000}s`);

  if (doNotDisturb) {
    wasDoNotDisturbAlreadyEnabled = await dnd.isEnabled();

    if (!wasDoNotDisturbAlreadyEnabled) {
      dnd.enable();
    }
  }

  console.log(`3 after ${(Date.now() - past) / 1000}s`);

  try {
    console.log(`4 after ${(Date.now() - past) / 1000}s`);
    await aperture.startRecording(apertureOpts);
    console.log(`Started recording after ${(Date.now() - past) / 1000}s`);
    setRecordingTray(stopRecording);
  } catch (err) {
    // This prevents the button from being reset, since the recording has not yet started
    // This delay is due to internal framework delays in aperture native code
    if (err.message.includes('stopRecording')) {
      console.log(`Recording not yet started, can't stop recording before it actually started`);
      return;
    }

    dialog.showErrorBox('Recording error', err.message);
  }
};

const stopRecording = async () => {
  closeAllCroppers();

  const filePath = await aperture.stopRecording();

  const {
    hideDesktopIcons,
    doNotDisturb
  } = settings.store;

  if (hideDesktopIcons) {
    desktopIcons.show();
  }

  if (doNotDisturb && !wasDoNotDisturbAlreadyEnabled) {
    dnd.disable();
  }

  openEditorWindow(filePath, lastRecordedFps);
};

module.exports = {
  startRecording,
  stopRecording,
  getAudioDevices: audioDevices
};
