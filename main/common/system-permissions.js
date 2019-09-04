const {systemPreferences, shell, dialog} = require('electron');

const getMicrophoneAccess = () => systemPreferences.getMediaAccessStatus('microphone');

const promptSystemPreferences = async ({asked} = {}) => {
  if (!asked) {
    const {response} = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Open System Preferences', 'Cancel'],
      defaultId: 0,
      message: 'Kap cannot access the microphone.',
      detail: 'Kap requires microphone access to be able to record audio. You can grant this in the System Preferences. Afterwards, relaunch Kap for the changes to take effect.',
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
