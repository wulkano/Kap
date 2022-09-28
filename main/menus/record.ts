import {Menu} from 'electron';
import {MenuItemId, MenuOptions} from './utils';
import {overallDuration, currentDurationStart, pauseRecording, resumeRecording, stopRecording} from '../aperture';
import formatTime from '../utils/format-time';

const getDurationLabel = () => {
  if (currentDurationStart <= 0) {
    return formatTime((overallDuration) / 1000, undefined);
  }
  return formatTime((overallDuration + (Date.now() - currentDurationStart)) / 1000, undefined);
}

const getDurationMenuItem = () => ({
  id: MenuItemId.duration,
  label: getDurationLabel(),
  enabled: false
});

const getStopRecordingMenuItem = () => ({
  id: MenuItemId.stopRecording,
  label: 'Stop',
  click: stopRecording
});

const getPauseRecordingMenuItem = () => ({
  id: MenuItemId.pauseRecording,
  label: 'Pause',
  click: pauseRecording
});

const getResumeRecordingMenuItem = () => ({
  id: MenuItemId.resumeRecording,
  label: 'Resume',
  click: resumeRecording
});

export const getRecordMenuTemplate = (isPaused: boolean): MenuOptions => [
  getDurationMenuItem(),
  {
    type: 'separator'
  },
  isPaused ? getResumeRecordingMenuItem() : getPauseRecordingMenuItem(),
  getStopRecordingMenuItem(),
  {
    type: 'separator'
  },
  {
    role: 'quit',
    accelerator: 'Command+Q'
  }
];

export const getRecordMenu = async (isPaused: boolean) => {
  return Menu.buildFromTemplate(getRecordMenuTemplate(isPaused));
};
