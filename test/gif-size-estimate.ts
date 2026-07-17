import {serial as test} from 'ava';
import fs from 'fs';
import path from 'path';
import {mockImport} from './helpers/mocks';

mockImport('../common/analytics', 'analytics');
mockImport('../plugins/service-context', 'service-context');
mockImport('../plugins', 'plugins');
mockImport('../common/settings', 'settings');

import {Encoding, Format} from '../main/common/types';
import {convertTo} from '../main/converters';
import {
  estimateGifSize,
  extrapolateGifSize,
  getGifSampleRanges
} from '../main/utils/gif-size-estimate';
import {Video} from '../main/video';

const input = path.resolve(__dirname, 'fixtures', 'input.mp4');
const noop = () => undefined;

test('uses the complete selection when it is cheap to convert', t => {
  t.deepEqual(getGifSampleRanges(4, 7), [{startTime: 4, endTime: 7}]);
});

test('samples the start, middle, and end of longer selections', t => {
  t.deepEqual(getGifSampleRanges(10, 20), [
    {startTime: 10, endTime: 11},
    {startTime: 14.5, endTime: 15.5},
    {startTime: 19, endTime: 20}
  ]);
});

test('does not create samples for invalid selections', t => {
  t.deepEqual(getGifSampleRanges(2, 2), []);
  t.deepEqual(getGifSampleRanges(3, 2), []);
  t.deepEqual(getGifSampleRanges(0, Number.POSITIVE_INFINITY), []);
});

test('extrapolates sampled bytes over the selected duration', t => {
  const ranges = getGifSampleRanges(10, 20);

  t.is(extrapolateGifSize([100, 200, 300], ranges, 10), 2000);
  t.is(extrapolateGifSize([100], ranges, 10), undefined);
  t.is(extrapolateGifSize([], [], 10), undefined);
});

test('reports the exact size when the complete selection is sampled', async t => {
  const video = new Video({
    filePath: input,
    title: 'input',
    fps: 30,
    encoding: Encoding.h264
  });
  const conversionOptions = {
    fps: 8,
    width: 128,
    height: 72,
    startTime: 0,
    endTime: 2,
    shouldCrop: true,
    shouldMute: true
  };

  const estimate = await estimateGifSize(video, conversionOptions);
  const outputPath = await convertTo(Format.gif, {
    ...conversionOptions,
    defaultFileName: 'gif-size-estimate-control',
    inputPath: input,
    shouldTrack: false,
    onCancel: noop,
    onProgress: noop
  });

  try {
    const {size} = await fs.promises.stat(outputPath);
    t.deepEqual(estimate, {
      bytes: size,
      sampleCount: 1,
      sampledDuration: 2
    });
  } finally {
    await fs.promises.unlink(outputPath).catch(noop);
    await fs.promises.rmdir(path.dirname(outputPath)).catch(noop);
  }
});

test('converts distributed samples for longer selections', async t => {
  const video = new Video({
    filePath: input,
    title: 'input',
    fps: 30,
    encoding: Encoding.h264
  });

  const estimate = await estimateGifSize(video, {
    fps: 4,
    width: 64,
    height: 36,
    startTime: 0,
    endTime: 4,
    shouldCrop: true,
    shouldMute: true
  });

  t.is(estimate?.sampleCount, 3);
  t.is(estimate?.sampledDuration, 3);
  t.true((estimate?.bytes ?? 0) > 0);
});
