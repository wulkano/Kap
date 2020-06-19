'use strict';

const audioDevices = require('macos-audio-devices');
const aperture = require('aperture');

const {showError} = require('./errors');
const {hasMicrophoneAccess} = require('../common/system-permissions');

const getAudioDevices = async () => {
  if (!hasMicrophoneAccess()) {
    return [];
  }

  try {
    const devices = await aperture.audioDevices();

    if (!Array.isArray(devices)) {
      const Sentry = require('./sentry');
      Sentry.captureException(new Error(`devices is not an array: ${JSON.stringify(devices)}`));

      return (await audioDevices.getInputDevices()).map(device => ({id: device.uid, name: device.name}));
    }

    return devices;
  } catch (error) {
    showError(error, {reportToSentry: true});
    return [];
  }
};

const getDefaultInputDevice = () => {
  const device = audioDevices.getDefaultInputDevice.sync();
  return {
    id: device.uid,
    name: device.name
  };
};

module.exports = {getAudioDevices, getDefaultInputDevice};
