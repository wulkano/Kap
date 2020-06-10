'use strict';

const {getInputDevices} = require('macos-audio-devices');
const {audioDevices} = require('aperture');

const {showError} = require('./errors');
const {hasMicrophoneAccess} = require('../common/system-permissions');

const getAudioDevices = async () => {
  if (!hasMicrophoneAccess()) {
    return [];
  }

  try {
    const devices = await audioDevices();

    if (!Array.isArray(devices)) {
      const Sentry = require('./sentry');
      Sentry.captureException(new Error(`devices is not an array: ${JSON.stringify(devices)}`));

      return (await getInputDevices()).map(device => ({id: device.uid, name: device.name}));
    }

    return devices;
  } catch (error) {
    showError(error, {reportToSentry: true});
    return [];
  }
};

module.exports = {getAudioDevices};
