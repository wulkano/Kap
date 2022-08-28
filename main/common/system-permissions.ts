import {join} from 'path';
import {existsSync, openSync} from 'fs';
import {systemPreferences, shell, dialog, app} from 'electron';
import {getAuthStatus, askForScreenCaptureAccess} from 'node-mac-permissions';
const {ensureDockIsShowing} = require('../utils/dock');

const hasAskedForScreenCapturePermissionsPath = join(app.getPath('userData'), '.has-asked-for-screen-capture-permissions');
let isDialogShowing = false;

const promptSystemPreferences = (options: {message: string; detail: string; systemPreferencesPath: string}) => async ({hasAsked}: {hasAsked?: boolean} = {}) => {
  if (hasAsked || isDialogShowing) {
    return false;
  }

  isDialogShowing = true;
  await ensureDockIsShowing(async () => {
    const {response} = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Open System Preferences', 'Cancel'],
      defaultId: 0,
      message: options.message,
      detail: options.detail,
      cancelId: 1
    });
    isDialogShowing = false;

    if (response === 0) {
      await openSystemPreferences(options.systemPreferencesPath);
      app.quit();
    }
  });

  return false;
};

export const openSystemPreferences = async (path: string) => shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?${path}`);

// Microphone

const getMicrophoneAccess = () => systemPreferences.getMediaAccessStatus('microphone');

const microphoneFallback = promptSystemPreferences({
  message: 'Kap cannot access the microphone.',
  detail: 'Kap requires microphone access to be able to record audio. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.',
  systemPreferencesPath: 'Privacy_Microphone'
});

export const ensureMicrophonePermissions = async (fallback = microphoneFallback) => {
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

export const hasMicrophoneAccess = () => getMicrophoneAccess() === 'granted';

// Screen Capture (10.15 and newer)

const screenCaptureFallback = promptSystemPreferences({
  message: 'Kap cannot record the screen.',
  detail: 'Kap requires screen capture access to be able to record the screen. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.',
  systemPreferencesPath: 'Privacy_ScreenCapture'
});

export const ensureScreenCapturePermissions = (fallback = screenCaptureFallback) => {
  // Check for screen capture permissions
  const status = getAuthStatus('screen');
  if (status === 'authorized') {
    return true;
  }

  // If not authorized for screen capture and we haven't already asked, then ask for permissions now
  if (!existsSync(hasAskedForScreenCapturePermissionsPath)) {
    askForScreenCaptureAccess();
    openSync(hasAskedForScreenCapturePermissionsPath, 'w');
    return false;
  }

  // If we've already asked, then prompt user again to give permission
  fallback();
  return false;
};

export const hasScreenCaptureAccess = () => getAuthStatus('screen') === 'authorized';
