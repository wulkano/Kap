import {serial as testAny, TestInterface} from 'ava';
import tempy from 'tempy';
import fs from 'fs';
import sinon, {SinonFakeTimers} from 'sinon';
import path from 'path';
import type {MockWindowManager} from './mocks/window-manager';

const test = testAny as TestInterface<{
  now: Date;
  clock: SinonFakeTimers;
  paths?: string[];
}>;

import {mockImport, mockModule} from './helpers/mocks';

mockImport('./windows/manager', 'window-manager');
mockImport('./plugins', 'plugins');
mockImport('./utils/sentry', 'sentry');
mockImport('../common/analytics', 'analytics');

import {shell} from './mocks/electron';
import * as dialog from './mocks/dialog';
import {plugins} from './mocks/plugins';
import Sentry from './mocks/sentry';
import {windowManager} from './mocks/window-manager';

import {
  recordingHistory,
  getPastRecordings,
  hasActiveRecording,
  addRecording,
  setCurrentRecording,
  updatePluginState,
  stopCurrentRecording,
  cleanPastRecordings,
  PastRecording
} from '../main/recording-history';
import type {Video} from '../main/video';

const incomplete = path.resolve(__dirname, 'fixtures', 'incomplete.mp4');
const corrupt = path.resolve(__dirname, 'fixtures', 'corrupt.mp4');

test.before(t => {
  t.context.now = new Date('2020-07-21T15:27:26.564Z');
  t.context.clock = sinon.useFakeTimers(t.context.now.getTime());
});

test.after(t => {
  t.context.clock.restore();
});

test.beforeEach(() => {
  recordingHistory.clear();
});

test.afterEach.always(t => {
  if (t.context.paths) {
    for (const path of t.context.paths) {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    }
  }
});

test('`getPastRecordings()`', t => {
  const existingPath = tempy.file({extension: 'mp4'});
  const missingPath = tempy.file({extension: 'mp4'});

  fs.writeFileSync(existingPath, 'data');
  t.context.paths = [existingPath];

  recordingHistory.set('recordings', [{filePath: existingPath}, {filePath: missingPath}]);

  t.deepEqual(getPastRecordings(), [{filePath: existingPath} as PastRecording]);
  t.deepEqual(recordingHistory.get('recordings'), [{filePath: existingPath} as PastRecording]);
});

test('`hasActiveRecording()` with no recording', async t => {
  t.false(await hasActiveRecording());
});

test('`hasActiveRecording()` with playable recording', async t => {
  const fakeService = {
    title: 'Fake Service',
    cleanUp: sinon.fake()
  };

  const fakePlugin = {
    name: 'kap-fake-plugin',
    recordServices: [fakeService]
  };

  plugins.recordingPlugins = [fakePlugin];

  recordingHistory.set('activeRecording', {
    filePath: incomplete,
    name: 'Incomplete',
    date: new Date().toISOString(),
    apertureOptions: {},
    plugins: {
      'kap-fake-plugin': {
        'Fake Service': {
          some: 'state'
        }
      }
    }
  });

  const checkPromise = hasActiveRecording();

  const dialogState = await dialog.waitForDialog();
  t.true(dialogState.detail.includes('playable'));

  // Don't delete it until user is done interacting with the dialog
  t.true(recordingHistory.has('activeRecording'));

  await dialog.fakeAction(dialogState.buttons.findIndex((b: any) => b.label?.toLowerCase().includes('editor')));

  const video = windowManager.editor.open.lastCall?.args?.[0] as Video;
  t.deepEqual(video?.filePath, incomplete);
  t.deepEqual(video?.title, 'Incomplete');

  t.true(await checkPromise);

  t.false(recordingHistory.has('activeRecording'));
  t.true(fakeService.cleanUp.calledOnceWith({some: 'state'}));
  t.deepEqual(
    recordingHistory.get('recordings'),
    [
      {
        filePath: incomplete,
        name: 'Incomplete',
        date: new Date().toISOString()
      }
    ]
  );
});

test('`hasActiveRecording()` with known corrupt recording', async t => {
  recordingHistory.set('activeRecording', {
    filePath: corrupt,
    name: 'Corrupt',
    date: new Date().toISOString(),
    apertureOptions: {},
    plugins: {}
  });

  const checkPromise = hasActiveRecording();

  const dialogState = await dialog.waitForDialog();
  t.true(dialogState.detail.includes('corrupt'));
  t.true(dialogState.detail.includes('moov atom not found'));
  t.truthy(dialogState.message);

  // Don't delete it until user is done interacting with the dialog
  t.true(recordingHistory.has('activeRecording'));

  await dialog.fakeAction(dialogState.defaultId);

  const newDialogState = await dialog.getCurrentState();
  t.true(newDialogState.message.includes('unable'));

  await dialog.fakeAction(newDialogState.defaultId);

  t.true(shell.showItemInFolder.calledWithExactly(corrupt));

  t.true(await checkPromise);

  t.false(recordingHistory.has('activeRecording'));
  t.is(recordingHistory.get('recordings').length, 0);
});

test('`hasActiveRecording()` with unknown corrupt recording', async t => {
  const filePath = tempy.file();
  fs.writeFileSync(filePath, 'data');
  t.context.paths = [filePath];

  recordingHistory.set('activeRecording', {
    filePath,
    name: 'Bad',
    date: new Date().toISOString(),
    apertureOptions: {},
    plugins: {}
  });

  const checkPromise = hasActiveRecording();

  const dialogState = await dialog.waitForDialog();
  t.true(dialogState.detail.includes('corrupt'));
  t.false(dialogState.detail.includes('moov atom not found'));
  t.falsy(dialogState.message);

  // Don't delete it until user is done interacting with the dialog
  t.true(recordingHistory.has('activeRecording'));

  await dialog.fakeAction(dialogState.defaultId);

  t.true(shell.showItemInFolder.calledWithExactly(filePath));

  t.true(await checkPromise);

  t.false(recordingHistory.has('activeRecording'));
  t.is(recordingHistory.get('recordings').length, 0);

  const sentryError = Sentry.captureException.lastCall.args[0];
  t.true(sentryError.message.startsWith('Corrupt recording:'));
});

test('`setCurrentRecording()`', t => {
  setCurrentRecording({
    filePath: 'some/path',
    apertureOptions: {some: 'options'} as any,
    plugins: {some: 'plugins'} as any
  });

  t.deepEqual(recordingHistory.get('activeRecording'), {
    filePath: 'some/path',
    name: 'Kapture 2020-07-21 at 11.27.26',
    date: t.context.now.toISOString(),
    apertureOptions: {some: 'options'} as any,
    plugins: {some: 'plugins'} as any
  });
});

test('`updatePluginState()`', t => {
  recordingHistory.set('activeRecording', {
    name: 'Some name',
    plugins: {
      plugin1: {
        service1: {some: 'state'}
      },
      plugin2: {
        service2: {}
      }
    }
  });

  updatePluginState({
    plugin1: {
      service1: {some: 'state'}
    },
    plugin2: {
      service2: {some: 'other state'}
    }
  });

  t.deepEqual(recordingHistory.get('activeRecording.plugins'), {
    plugin1: {
      service1: {some: 'state'}
    },
    plugin2: {
      service2: {some: 'other state'}
    }
  });
});

test('`stopCurrentRecording()`', t => {
  const filePath = tempy.file({extension: 'mp4'});
  fs.writeFileSync(filePath, 'data');
  t.context.paths = [filePath];

  recordingHistory.set('activeRecording', {
    filePath,
    name: 'some name'
  });

  stopCurrentRecording();

  t.false(recordingHistory.has('activeRecording'));
  t.deepEqual(recordingHistory.get('recordings'), [{filePath, name: 'some name', date: t.context.now.toISOString()}]);

  recordingHistory.set('activeRecording', {
    filePath,
    name: 'some name'
  });

  stopCurrentRecording('new name');

  t.false(recordingHistory.has('activeRecording'));
  t.deepEqual(recordingHistory.get('recordings'), [
    {filePath, name: 'new name', date: t.context.now.toISOString()},
    {filePath, name: 'some name', date: t.context.now.toISOString()}
  ]);
});

test('`cleanPastRecordings()`', t => {
  const filePath = tempy.file({extension: 'mp4'});
  fs.writeFileSync(filePath, 'data');
  t.context.paths = [filePath];

  recordingHistory.set('recordings', [
    {filePath},
    // Should ignore file that doesn't exist
    {filePath: tempy.file({extension: 'mp4'})}
  ]);

  cleanPastRecordings();

  t.false(fs.existsSync(filePath));
});

test('`addRecording()`', t => {
  const filePath = tempy.file({extension: 'mp4'});

  addRecording({filePath} as PastRecording);

  t.is(recordingHistory.get('recordings').length, 0);

  fs.writeFileSync(filePath, 'data');
  t.context.paths = [filePath];

  addRecording({filePath} as PastRecording);

  t.deepEqual(recordingHistory.get('recordings'), [{filePath} as PastRecording]);
});
