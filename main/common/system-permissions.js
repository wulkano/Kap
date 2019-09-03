const {systemPreferences, shell, dialog} = require('electron');

const getMicrophoneAccess = () => systemPreferences.getMediaAccessStatus('microphone');

const promptSystemPreferences = async ({asked} = {}) => {
  if (!asked) {
    const {response} = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['System Prefernces', 'Cancel'],
      defaultId: 0,
      message: 'Can not access audio input device',
      detail: 'Enable sound recording by giving Kap access to your audio input devices in your system settings. Quit and re-open Kap for the changes to take effect.',
      cancelId: 1
    });

    if (response === 0) {
      openSystemPreferences();
    }
  }

  return false;
};

const ensureMicrophonePermissions = async (fallback = promptSystemPreferences) => {
  const access = getMicrophoneAccess();

  if (access === 'granted') {
    return true;
  }

  if (access !== 'denied') {
    const granted = await systemPreferences.askForMediaAccess('microphone');

    if (granted) {
      return true;
    }

    return fallback({asked: true});
  }

  return fallback();
};

const openSystemPreferences = () => shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');

const hasMicrophoneAccess = () => getMicrophoneAccess() === 'granted';

module.exports = {
  ensureMicrophonePermissions,
  hasMicrophoneAccess,
  openSystemPreferences
};
