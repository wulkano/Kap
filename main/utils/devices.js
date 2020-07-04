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
    const devices = await audioDevices.getInputDevices();

    return devices.sort((a, b) => {
      if (a.transportType === b.transportType) {
        return a.name.localeCompare(b.name);
      }

      if (a.transportType === 'builtin') {
        return -1;
      }

      if (b.transportType === 'builtin') {
        return 1;
      }

      return 0;
    }).map(device => ({id: device.uid, name: device.name}));
  } catch (error) {
    const devices = await aperture.audioDevices();

    if (!Array.isArray(devices)) {
      const Sentry = require('./sentry');
      Sentry.captureException(new Error(`devices is not an array: ${JSON.stringify(devices)}`));
      showError(error);
      return [];
    }
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
