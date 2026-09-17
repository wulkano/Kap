import {systemPreferences, shell, dialog, app, desktopCapturer} from 'electron';
import fs from 'fs';
import path from 'path';
const {ensureDockIsShowing} = require('../utils/dock');

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

// Electron reports this natively, so Kap does not need to bundle a helper
// executable to read it. The old `mac-screen-capture-permissions` helper was
// shipped as an Intel-only binary, which made every call to it fail with
// EBADARCH on Apple Silicon Macs that do not have Rosetta installed.
const getScreenCaptureAccess = () => systemPreferences.getMediaAccessStatus('screen');

const screenCaptureFallback = promptSystemPreferences({
  message: 'Kap cannot record the screen.',
  detail: 'Kap requires screen capture access to be able to record the screen. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.',
  systemPreferencesPath: 'Privacy_ScreenCapture'
});

export const hasScreenCaptureAccess = () => getScreenCaptureAccess() === 'granted';

// `getMediaAccessStatus` only reads the current status, it does not ask for
// access. So the first time we find the permission missing we also make a real
// capture request through `desktopCapturer`, standing in for the
// `CGRequestScreenCaptureAccess` call the native helper used to make. After
// that we point the user at System Preferences ourselves.
const requestedAccessMarker = () => path.join(app.getPath('userData'), '.has-app-requested-screen-capture-permissions');

const hasRequestedScreenCaptureAccess = () => {
  try {
    return fs.existsSync(requestedAccessMarker());
  } catch {
    return false;
  }
};

const requestScreenCaptureAccess = () => {
  try {
    fs.writeFileSync(requestedAccessMarker(), '');
  } catch {
    // The marker is only used to decide which prompt to show next time.
  }

  // Deliberately not awaited: this exists for the permission prompt it
  // triggers, not for the sources it returns.
  desktopCapturer.getSources({types: ['screen'], thumbnailSize: {width: 0, height: 0}}).catch(() => undefined);
};

export const ensureScreenCapturePermissions = (fallback = screenCaptureFallback) => {
  if (hasScreenCaptureAccess()) {
    return true;
  }

  if (hasRequestedScreenCaptureAccess()) {
    fallback();
  } else {
    requestScreenCaptureAccess();
  }

  return false;
};
