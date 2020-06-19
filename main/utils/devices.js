'use strict';

const audioDevices = require('macos-audio-devices');
const aperture = require('aperture');

const {showError} = require('./errors');
const {hasMicrophoneAccess} = require('../common/system-permissions');
const {builtInMicrophoneId} = require('../common/constants');

const getAudioDevices = async () => {
  if (!hasMicrophoneAccess()) {
    return [];
  }

  try {
    const devices = await aperture.audioDevices();

    if (!Array.isArray(devices)) {
      const Sentry = require('./sentry');
      Sentry.captureException(new Error(`devices is not an array: ${JSON.stringify(devices)}`));

      return (await audioDevices.getInputDevices()).map(device => ({id: device.uid, name: device.name})).sort(devicesSort);
    }

    return devices.sort(devicesSort);
  } catch (error) {
    showError(error, {reportToSentry: true});
    return [];
  }
};

const devicesSort = (a, b) => {
  if (a.id === builtInMicrophoneId) {
    return -1;
  }

  if (b.id === builtInMicrophoneId) {
    return 1;
  }

  return 0;
};

const getDefaultInputDevice = () => {
  const device = audioDevices.getDefaultInputDevice.sync();
  return {
    id: device.uid,
    name: device.name
  };
};

module.exports = {getAudioDevices, getDefaultInputDevice};
