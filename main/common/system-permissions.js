const {systemPreferences, dialog, app} = require('electron');
const {openSystemPreferences} = require('electron-util');
const {
  hasScreenCapturePermission,
  hasPromptedForPermission,
  openSystemPreferences: openScreenCapturePreferences
} = require('mac-screen-capture-permissions');

let dialogShowing = false;

const promptSystemPreferences = options => async ({hasAsked} = {}) => {
  if (hasAsked || dialogShowing) {
    return false;
  }

  dialogShowing = true;
  const {response} = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Open System Preferences', 'Cancel'],
    defaultId: 0,
    message: options.message,
    detail: options.detail,
    cancelId: 1
  });
  dialogShowing = false;

  if (response === 0) {
    await options.action();
    app.quit();
  }

  return false;
};

// Microphone

const getMicrophoneAccess = () => systemPreferences.getMediaAccessStatus('microphone');

const microphoneFallback = promptSystemPreferences({
  message: 'Kap cannot access the microphone.',
  detail: 'Kap requires microphone access to be able to record audio. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.',
  action: () => openSystemPreferences('security', 'Privacy_Microphone')
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
  detail: 'Kap requires screen capture access to be able to record the screen. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.',
  action: openScreenCapturePreferences
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
