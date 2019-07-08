'use strict';

const {dialog} = require('electron');
const desktopIcons = require('hide-desktop-icons');
const dnd = require('@sindresorhus/do-not-disturb');
const createAperture = require('aperture');

const {openEditorWindow} = require('../editor');
const {closePrefsWindow} = require('../preferences');
const {setRecordingTray, disableTray, resetTray} = require('../tray');
const {disableCroppers, setRecordingCroppers, closeAllCroppers} = require('../cropper');
const {setCropperShortcutAction} = require('../global-accelerators');

// eslint-disable-next-line no-unused-vars
const {convertToH264} = require('../utils/encoding');

const settings = require('./settings');
const {track} = require('./analytics');

const aperture = createAperture();
const {audioDevices, videoCodecs} = createAperture;

// eslint-disable-next-line no-unused-vars
const recordHevc = videoCodecs.has('hevc');

let wasDoNotDisturbAlreadyEnabled;
let lastUsedSettings;

let past;

const cleanup = () => {
  const {
    hideDesktopIcons,
    doNotDisturb
  } = lastUsedSettings;

  closeAllCroppers();
  resetTray();

  if (hideDesktopIcons) {
    desktopIcons.show();
  }

  if (doNotDisturb && !wasDoNotDisturbAlreadyEnabled) {
    dnd.disable();
  }

  setCropperShortcutAction();
};

const startRecording = async options => {
  if (past) {
    return;
  }

  past = Date.now();

  closePrefsWindow();
  disableTray();
  disableCroppers();

  const {cropperBounds, screenBounds, displayId} = options;

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
    screenId: displayId
  };

  lastUsedSettings = {
    recordedFps: apertureOpts.fps,
    hideDesktopIcons,
    doNotDisturb
  };

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

  // TODO: figure out how to correctly process hevc videos with ffmpeg
  // if (recordHevc) {
  //   apertureOpts.videoCodec = 'hevc';
  // }

  console.log(`Collected settings after ${(Date.now() - past) / 1000}s`);

  if (hideDesktopIcons) {
    await desktopIcons.hide();
  }

  console.log(`Hide desktop icons after ${(Date.now() - past) / 1000}s`);

  if (doNotDisturb) {
    wasDoNotDisturbAlreadyEnabled = await dnd.isEnabled();

    if (!wasDoNotDisturbAlreadyEnabled) {
      dnd.enable();
    }
  }

  console.log(`Took care of DND after ${(Date.now() - past) / 1000}s`);

  try {
    await aperture.startRecording(apertureOpts);
  } catch (error) {
    track('recording/stopped/error');
    dialog.showErrorBox('Recording error', error.message);
    past = null;
    return;
  }

  const startTime = (Date.now() - past) / 1000;
  if (startTime > 3) {
    track(`recording/started/${startTime}`);
  } else {
    track('recording/started');
  }

  console.log(`Started recording after ${startTime}s`);
  setRecordingCroppers();
  setRecordingTray(stopRecording);
  setCropperShortcutAction(stopRecording);
  past = Date.now();

  // Track aperture errors after recording has started, to avoid kap freezing if something goes wrong
  aperture.recorder.catch(error => {
    // Make sure it doesn't catch the error of ending the recording
    if (past) {
      track('recording/stopped/error');
      dialog.showErrorBox('Recording error', error.message);
      past = null;
      cleanup();
    }
  });
};

const stopRecording = async () => {
  // Ensure we only stop recording once
  if (!past) {
    return;
  }

  console.log(`Stopped recording after ${(Date.now() - past) / 1000}s`);
  past = null;

  let filePath;

  try {
    filePath = await aperture.stopRecording();
  } catch (error) {
    track('recording/stopped/error');
    dialog.showErrorBox('Recording error', error.message);
    return;
  }

  const {recordedFps} = lastUsedSettings;

  try {
    cleanup();
  } finally {
    track('editor/opened/recording');

    // TODO: bring this back when we figure out how to convert hevc files
    // if (recordHevc) {
    //   openEditorWindow(await convertToH264(filePath), {recordedFps, isNewRecording: true, originalFilePath: filePath});
    // } else {
    openEditorWindow(filePath, {recordedFps, isNewRecording: true});
    // }
  }
};

module.exports = {
  startRecording,
  stopRecording,
  getAudioDevices: audioDevices
};
