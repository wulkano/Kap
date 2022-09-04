import {Menu} from 'electron';
import {MenuItemId, MenuOptions} from './utils';
import {pauseRecording, resumeRecording, stopRecording} from '../aperture';

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

const getRecordMenuTemplate = (isPaused: boolean): MenuOptions => [
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
