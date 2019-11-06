const {systemPreferences, shell, dialog} = require('electron');
const {hasScreenCapturePermission, hasPromptedForPermission} = require('mac-screen-capture-permissions');

const promptSystemPreferences = opts => async ({hasAsked} = {}) => {
  if (hasAsked) {
    return false;
  }

  const {response} = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Open System Preferences', 'Cancel'],
    defaultId: 0,
    message: opts.message,
    detail: opts.detail,
    cancelId: 1
  });

  if (response === 0) {
    openSystemPreferences(opts.systemPreferencesPath);
  }

  return false;
};

const openSystemPreferences = path => shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?${path}`);

// Microphone

const getMicrophoneAccess = () => systemPreferences.getMediaAccessStatus('microphone');

const microphoneFallback = promptSystemPreferences({
  message: 'Kap cannot access the microphone.',
  detail: 'Kap requires microphone access to be able to record audio. You can grant this in the System Preferences. Afterwards, relaunch Kap for the changes to take effect.',
  systemPreferencesPath: 'Privacy_Microphone'
});

const ensureMicrophonePermissions = async (fallback = microphoneFallback) => {
  const access = getMicrophoneAccess();

  if (access === 'granted') {
    return true;
  }

  if (access !== 'denied') {
    const granted = await systemPreferences.askForMediaAccess('microphone');

    if (granted) {
      return true;
    }

    return fallback({hasAsked: true});
  }

  return fallback();
};

const hasMicrophoneAccess = () => getMicrophoneAccess() === 'granted';

// Screen Capture (10.15 and newer)

const screenCaptureFallback = promptSystemPreferences({
  message: 'Kap cannot record the screen.',
  detail: 'Kap requires screen capture access to be able to record the screen. You can grant this in the System Preferences. Afterwards, relaunch Kap for the changes to take effect.',
  systemPreferencesPath: 'Privacy_ScreenCapture'
});

const ensureScreenCapturePermissions = (fallback = screenCaptureFallback) => {
  const hadAsked = hasPromptedForPermission();

  const hasAccess = hasScreenCapturePermission();

  if (hasAccess) {
    return true;
  }

  fallback({hasAsked: !hadAsked});
  return false;
};

const hasScreenCaptureAccess = () => hasScreenCapturePermission();

module.exports = {
  ensureMicrophonePermissions,
  hasMicrophoneAccess,
  openSystemPreferences,
  ensureScreenCapturePermissions,
  hasScreenCaptureAccess
};
