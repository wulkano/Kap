import test from 'ava';
import path from 'path';
import {mockImport} from './helpers/mocks';

mockImport('../common/analytics', 'analytics');
mockImport('../plugins/service-context', 'service-context');
mockImport('../plugins', 'plugins');
mockImport('../common/settings', 'settings');

import {estimateGifSize} from '../main/utils/gif-size-estimate';
import {Encoding} from '../main/common/types';
import {Video} from '../main/video';

const input = path.resolve(__dirname, 'fixtures', 'input.mp4');

test('estimates GIF size from a representative sample', async t => {
  const video = new Video({
    filePath: input,
    title: 'input',
    fps: 30,
    encoding: Encoding.h264
  });

  const estimate = await estimateGifSize(video, {
    fps: 10,
    width: 255,
    height: 143,
    startTime: 0,
    endTime: 4,
    shouldCrop: true,
    shouldMute: true
  });

  t.regex(estimate!, /\d+.*B$/);
});

test('does not estimate an empty range', async t => {
  const video = new Video({
    filePath: input,
    title: 'input',
    fps: 30,
    encoding: Encoding.h264
  });

  const estimate = await estimateGifSize(video, {
    fps: 10,
    width: 255,
    height: 143,
    startTime: 2,
    endTime: 2,
    shouldCrop: true,
    shouldMute: true
  });

  t.is(estimate, undefined);
});
