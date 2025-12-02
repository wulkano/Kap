import test from 'ava';
import delay from 'delay';
import {ExportStatus, Format} from '../main/common/types';
import Export from '../main/export';
import Video from './mocks/video';

test('Export status should be canceled if canceled during action', async t => {
  const mockVideo = new Video() as any;
  mockVideo.title = 'test-video';
  mockVideo.generatePreviewImage = () => {};

  let resolveAction: (value?: unknown) => void = () => {};
  const actionPromise = new Promise(resolve => {
    resolveAction = resolve;
  });

  const mockService = {
    title: 'test-service',
    formats: [Format.mp4],
    action: async () => actionPromise
  };

  const mockPlugin = {
    name: 'test-plugin',
    shareServices: [mockService]
  };

  const exportInstance = new Export(
    mockVideo,
    Format.mp4,
    {width: 100, height: 100, fps: 30} as any,
    {
      plugin: mockPlugin as any,
      service: mockService as any,
      extras: {}
    }
  );

  // Start export
  exportInstance.on('updated', state => {
    console.log('Updated state:', state.status);
  });
  const startPromise = exportInstance.start();

  // Wait a bit to ensure it started
  await delay(10);

  // Cancel it
  exportInstance.cancel();

  // Resolve the action *after* cancel
  resolveAction();

  // Wait for startPromise to settle
  await startPromise;

  await delay(10);

  // Assert status
  t.is(exportInstance.status, ExportStatus.canceled, 'Export status should be canceled');
});
