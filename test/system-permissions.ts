import test from 'ava';
import fs from 'fs';
import path from 'path';

import {app, dialog, desktopCapturer, mediaAccessStatus} from './mocks/electron';
import {ensureScreenCapturePermissions, hasScreenCaptureAccess} from '../main/common/system-permissions';

const markerPath = () => path.join(app.getPath('userData'), '.has-app-requested-screen-capture-permissions');

// Lets the floating promises inside `ensureScreenCapturePermissions` run.
const flush = async () => new Promise(resolve => {
  setImmediate(resolve);
});

test.beforeEach(() => {
  (dialog.showMessageBox as any).resetHistory();
  (desktopCapturer.getSources as any).resetHistory();

  if (fs.existsSync(markerPath())) {
    fs.unlinkSync(markerPath());
  }
});

test.serial('screen capture access is read from the system permission status', t => {
  mediaAccessStatus.screen = 'granted';
  t.true(hasScreenCaptureAccess());

  mediaAccessStatus.screen = 'denied';
  t.false(hasScreenCaptureAccess());
});

test.serial('access already granted passes straight through', async t => {
  mediaAccessStatus.screen = 'granted';

  t.true(ensureScreenCapturePermissions());

  await flush();
  t.false((desktopCapturer.getSources as any).called, 'should not request access it already has');
  t.false((dialog.showMessageBox as any).called, 'should not show a dialog');
});

test.serial('the first denial asks macOS for access instead of showing a dialog', async t => {
  mediaAccessStatus.screen = 'denied';

  t.false(ensureScreenCapturePermissions());

  await flush();
  t.true((desktopCapturer.getSources as any).called, 'should trigger the system permission prompt');
  t.false((dialog.showMessageBox as any).called, 'the system prompt is enough the first time');
});

test.serial('a later denial points the user at System Preferences', async t => {
  mediaAccessStatus.screen = 'denied';

  // First call records that we already asked macOS.
  ensureScreenCapturePermissions();
  await flush();
  (desktopCapturer.getSources as any).resetHistory();

  t.false(ensureScreenCapturePermissions());

  await flush();
  t.false((desktopCapturer.getSources as any).called, 'should not ask macOS twice');
  t.true((dialog.showMessageBox as any).called, 'should offer to open System Preferences');
});
