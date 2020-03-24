'use strict';

const {dialog} = require('electron');
const createAperture = require('aperture');

const {openEditorWindow} = require('../editor');
const {closePrefsWindow} = require('../preferences');
const {setRecordingTray, disableTray, resetTray} = require('../tray');
const {disableCroppers, setRecordingCroppers, closeAllCroppers} = require('../cropper');
const {setCropperShortcutAction} = require('../global-accelerators');

// eslint-disable-next-line no-unused-vars
const {convertToH264} = require('../utils/encoding');

const {hasMicrophoneAccess} = require('./system-permissions');

const settings = require('./settings');
const {track} = require('./analytics');
const plugins = require('./plugins');
const {showError} = require('../utils/errors');
const {RecordServiceContext} = require('../service-context');

const aperture = createAperture();
const {audioDevices, videoCodecs} = createAperture;

// eslint-disable-next-line no-unused-vars
const recordHevc = videoCodecs.has('hevc');

let lastUsedSettings;
let recordingPlugins = [];
const serviceState = new Map();
let apertureOptions;
let recordingName;
let past;

const setRecordingName = name => {
  recordingName = name;
};

const callPlugins = async method => Promise.all(recordingPlugins.map(async ({plugin, service}) => {
  if (service[method] && typeof service[method] === 'function') {
    try {
      await service[method](
        new RecordServiceContext({
          apertureOptions,
          state: serviceState.get(service.title),
          config: plugin.config,
          setRecordingName
        })
      );
    } catch (error) {
      showError(error);
    }
  }
}));

const cleanup = async () => {
  closeAllCroppers();
  resetTray();

  await callPlugins('didStopRecording');
  serviceState.clear();

  setCropperShortcutAction();
};

const startRecording = async options => {
  if (past) {
    return;
  }

  past = Date.now();
  recordingName = undefined;

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
    audioInputDeviceId
  } = settings.store;

  apertureOptions = {
    fps: record60fps ? 60 : 30,
    cropArea: cropperBounds,
    showCursor,
    highlightClicks,
    screenId: displayId
  };

  lastUsedSettings = {
    recordedFps: apertureOptions.fps
  };

  if (recordAudio === true) {
    // In case for some reason the default audio device is not set
    // use the first available device for recording
    if (audioInputDeviceId) {
      apertureOptions.audioDeviceId = audioInputDeviceId;
    } else {
      const [defaultAudioDevice] = await audioDevices();
      apertureOptions.audioDeviceId = defaultAudioDevice && defaultAudioDevice.id;
    }
  }

  // TODO: figure out how to correctly process hevc videos with ffmpeg
  // if (recordHevc) {
  //   apertureOptions.videoCodec = 'hevc';
  // }

  console.log(`Collected settings after ${(Date.now() - past) / 1000}s`);

  recordingPlugins = plugins
    .getRecordingPlugins()
    .flatMap(
      plugin => plugin.recordServicesWithStatus
        // Make sure service is valid and enabled
        .filter(({title, isEnabled}) => isEnabled && plugin.config.validServices.includes(title))
        .map(service => ({plugin, service}))
    );

  for (const {service, plugin} of recordingPlugins) {
    serviceState.set(service.title, {});
    track(`plugins/used/record/${plugin.name}`);
  }

  await callPlugins('willStartRecording');

  try {
    await aperture.startRecording(apertureOptions);
  } catch (error) {
    track('recording/stopped/error');
    showError(error, {title: 'Recording error', reportToSentry: true});
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
      showError(error, {title: 'Recording error', reportToSentry: true});
      past = null;
      cleanup();
    }
  });

  await callPlugins('didStartRecording');
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
    cleanup();
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
    openEditorWindow(filePath, {recordedFps, isNewRecording: true, recordingName});
    // }
  }
};

module.exports = {
  startRecording,
  stopRecording,
  getAudioDevices: () => {
    if (hasMicrophoneAccess()) {
      return audioDevices();
    }

    return [];
  }
};
