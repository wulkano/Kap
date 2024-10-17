import {hasMicrophoneAccess} from '../common/system-permissions';
import * as audioDevices from 'macos-audio-devices';
import {settings} from '../common/settings';
import {defaultInputDeviceId} from '../common/constants';
import Sentry from './sentry';
import {ipcMain as ipc} from 'electron';
import {ipcMain} from 'electron-better-ipc';
const aperture = require('aperture');

const {showError} = require('./errors');

export const getAudioDevices = async () => {
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
    try {
      const devices = await aperture.audioDevices();

      if (!Array.isArray(devices)) {
        Sentry.captureException(new Error(`devices is not an array: ${JSON.stringify(devices)}`));
        showError(error);
        return [];
      }

      return devices;
    } catch (error) {
      showError(error);
      return [];
    }
  }
};

export const getDefaultInputDevice = () => {
  try {
    const device = audioDevices.getDefaultInputDevice.sync();
    return {
      id: device.uid,
      name: device.name
    };
  } catch {
    // Running on 10.13 and don't have swift support libs. No need to report
    return undefined;
  }
};

export const getSelectedInputDeviceId = () => {
  const audioInputDeviceId = settings.get('audioInputDeviceId', defaultInputDeviceId);

  if (audioInputDeviceId === defaultInputDeviceId) {
    const device = getDefaultInputDevice();
    return device?.id;
  }

  return audioInputDeviceId;
};

export const initializeDevices = async () => {
  ipc.on('get-selected-input-device-id', event => {
    event.returnValue = getSelectedInputDeviceId();
  });

  ipcMain.answerRenderer('get-audio-devices', async () => {
    return {
      audioDevices: await getAudioDevices(),
      defaultDevice: getDefaultInputDevice()
    };
  });

  const audioInputDeviceId = settings.get('audioInputDeviceId');

  if (hasMicrophoneAccess()) {
    const devices = await getAudioDevices();

    if (!devices.some((device: any) => device.id === audioInputDeviceId)) {
      settings.set('audioInputDeviceId', defaultInputDeviceId);
    }
  }
};
