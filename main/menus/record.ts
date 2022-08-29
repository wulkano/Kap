import {Menu} from 'electron';
import {MenuItemId, MenuOptions} from './utils';
import {pauseRecording, resumeRecording, stopRecording} from '../aperture';

const getRecordMenuTemplate = async (): Promise<MenuOptions> => [
  getStopRecordingMenuItem(),
  getPauseRecordingMenuItem()
];

const getPausedMenuTemplate = async (): Promise<MenuOptions> => [
  getStopRecordingMenuItem(),
  getResumeRecordingMenuItem()
];

const getStopRecordingMenuItem = () => ({
  id: MenuItemId.stopRecording,
  label: 'Stop Recording',
  click: stopRecording
});

const getPauseRecordingMenuItem = () => ({
  id: MenuItemId.pauseRecording,
  label: 'Pause Recording',
  click: pauseRecording
});

const getResumeRecordingMenuItem = () => ({
  id: MenuItemId.resumeRecording,
  label: 'Resume Recording',
  click: resumeRecording
});

export const getRecordMenu = async (isPaused: boolean) => {
  if (isPaused) {
    return Menu.buildFromTemplate(await getPausedMenuTemplate());
  }

  return Menu.buildFromTemplate(await getRecordMenuTemplate());
};
