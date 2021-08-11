import {serial as testAny, TestInterface} from 'ava';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import uniqueString from 'unique-string';

const test = testAny as TestInterface<{outputPath: string}>;

import {getVideoMetadata} from './helpers/video-utils';
import {almostEquals} from './helpers/assertions';
import {getFormatExtension} from '../main/common/constants';
import {Except, SetOptional} from 'type-fest';
import {mockImport} from './helpers/mocks';
import {Format} from '../main/common/types';

const getRandomFileName = (ext: Format = Format.mp4) => `${uniqueString()}.${getFormatExtension(ext)}`;

const input = path.resolve(__dirname, 'fixtures', 'input.mp4');
const retinaInput = path.resolve(__dirname, 'fixtures', 'input@2x.mp4');

mockImport('../common/analytics', 'analytics');
mockImport('../plugins/service-context', 'service-context');
mockImport('../plugins', 'plugins');
const {settings} = mockImport('../common/settings', 'settings');

import {convertTo} from '../main/converters';
import {ConvertOptions} from '../main/converters/utils';

test.afterEach.always(t => {
  if (t.context.outputPath && fs.existsSync(t.context.outputPath)) {
    fs.unlinkSync(t.context.outputPath);
  }
});

const convert = async (format: Format, options: SetOptional<Except<ConvertOptions, 'outputPath'>, 'onCancel' | 'onProgress' | 'shouldMute'>) => {
  return convertTo(format, {
    defaultFileName: getRandomFileName(format),
    onProgress: sinon.fake(),
    onCancel: sinon.fake(),
    shouldMute: true,
    ...options
  });
};

// MP4

test('mp4: retina with sound', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert(Format.mp4, {
    shouldMute: false,
    inputPath: retinaInput,
    fps: 39,
    width: 469,
    height: 839,
    startTime: 30,
    endTime: 43.5,
    shouldCrop: true,
    onProgress
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  // Makes dimensions even
  t.is(meta.size.width, 470);
  t.is(meta.size.height, 840);

  t.is(meta.fps, 39);
  t.true(almostEquals(meta.duration, 13.5));
  t.is(meta.encoding, 'h264');

  t.true(meta.hasAudio);

  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number, sinon.match.string));
});

test('mp4: retina without sound', async t => {
  t.context.outputPath = await convert(Format.mp4, {
    shouldMute: true,
    inputPath: retinaInput,
    fps: 10,
    width: 46,
    height: 83,
    startTime: 0,
    endTime: 5,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.false(meta.hasAudio);
});

test('mp4: non-retina', async t => {
  t.context.outputPath = await convert(Format.mp4, {
    shouldMute: false,
    inputPath: input,
    fps: 30,
    width: 255,
    height: 143,
    startTime: 11.5,
    endTime: 27,
    // Should resize even though this is false, because dimensions are odd
    shouldCrop: false
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  // Makes dimensions even
  t.is(meta.size.width, 256);
  t.is(meta.size.height, 144);

  t.is(meta.fps, 30);
  t.true(almostEquals(meta.duration, 15.5));
  t.is(meta.encoding, 'h264');

  t.false(meta.hasAudio);
});

// WEBM

test('webm: retina with sound', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert(Format.webm, {
    shouldMute: false,
    inputPath: retinaInput,
    fps: 39,
    width: 469,
    height: 839,
    startTime: 30,
    endTime: 43.5,
    shouldCrop: true,
    onProgress
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.is(meta.size.width, 470);
  t.is(meta.size.height, 840);

  t.is(meta.fps, 39);
  t.true(almostEquals(meta.duration, 13.5));
  t.is(meta.encoding, 'vp9');

  t.true(meta.hasAudio);

  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number, sinon.match.string));
});

test('webm: retina without sound', async t => {
  t.context.outputPath = await convert(Format.webm, {
    shouldMute: true,
    inputPath: retinaInput,
    fps: 10,
    width: 46,
    height: 83,
    startTime: 0,
    endTime: 5,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.false(meta.hasAudio);
});

test('webm: non-retina', async t => {
  t.context.outputPath = await convert(Format.webm, {
    shouldMute: false,
    inputPath: input,
    fps: 30,
    width: 255,
    height: 143,
    startTime: 11.5,
    endTime: 27,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.is(meta.size.width, 256);
  t.is(meta.size.height, 144);

  t.is(meta.fps, 30);
  t.true(almostEquals(meta.duration, 15.5));
  t.is(meta.encoding, 'vp9');

  t.false(meta.hasAudio);
});

// APNG

test('apng: retina', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert(Format.apng, {
    shouldMute: false,
    inputPath: retinaInput,
    fps: 15,
    width: 469,
    height: 839,
    startTime: 30,
    endTime: 43.5,
    shouldCrop: true,
    onProgress
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.is(meta.size.width, 469);
  t.is(meta.size.height, 839);

  t.is(meta.fps, 15);
  t.is(meta.encoding, 'apng');

  t.false(meta.hasAudio);

  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number, sinon.match.string));
});

test('apng: non-retina', async t => {
  t.context.outputPath = await convert(Format.apng, {
    shouldMute: false,
    inputPath: input,
    fps: 15,
    width: 255,
    height: 143,
    startTime: 11.5,
    endTime: 27,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.is(meta.size.width, 255);
  t.is(meta.size.height, 143);

  t.is(meta.fps, 15);
  t.is(meta.encoding, 'apng');

  t.false(meta.hasAudio);
});

// GIF

test('gif: retina', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert(Format.gif, {
    shouldMute: false,
    inputPath: retinaInput,
    fps: 10,
    width: 236,
    height: 420,
    startTime: 0,
    endTime: 8.5,
    shouldCrop: true,
    onProgress
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.is(meta.size.width, 236);
  t.is(meta.size.height, 420);

  t.is(meta.fps, 10);
  t.true(almostEquals(meta.duration, 8.5));
  t.is(meta.encoding, 'gif');

  t.false(meta.hasAudio);

  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number, sinon.match.string));
});

test('gif: non-retina', async t => {
  t.context.outputPath = await convert(Format.gif, {
    shouldMute: false,
    inputPath: input,
    fps: 15,
    width: 255,
    height: 143,
    startTime: 11.5,
    endTime: 27,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.is(meta.size.width, 255);
  t.is(meta.size.height, 143);

  t.is(meta.fps, 15);
  t.true(almostEquals(meta.duration, 15.5));
  t.is(meta.encoding, 'gif');

  t.false(meta.hasAudio);
});

test('gif: lossy', async t => {
  settings.setMock('lossyCompression', false);

  const regular = await convert(Format.gif, {
    inputPath: input,
    fps: 20,
    width: 510,
    height: 286,
    startTime: 1,
    endTime: 10,
    shouldCrop: true
  });

  settings.setMock('lossyCompression', true);

  const lossy = await convert(Format.gif, {
    inputPath: input,
    fps: 20,
    width: 510,
    height: 286,
    startTime: 1,
    endTime: 10,
    shouldCrop: true
  });

  t.true(
    fs.statSync(regular).size >=
    fs.statSync(lossy).size
  );
});

// AV1

test('av1: retina with sound', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert(Format.av1, {
    shouldMute: false,
    inputPath: retinaInput,
    fps: 15,
    width: 235,
    height: 420,
    startTime: 30,
    endTime: 35.5,
    shouldCrop: true,
    onProgress
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  // Makes dimensions even
  t.is(meta.size.width, 236);
  t.is(meta.size.height, 420);

  t.is(meta.fps, 15);
  t.true(almostEquals(meta.duration, 5.5));
  t.is(meta.encoding, 'av1');

  t.true(meta.hasAudio);

  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number, sinon.match.string));
});

test('av1: retina without sound', async t => {
  t.context.outputPath = await convert(Format.av1, {
    shouldMute: true,
    inputPath: retinaInput,
    fps: 10,
    width: 100,
    height: 200,
    startTime: 0,
    endTime: 4,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.false(meta.hasAudio);
});

test('av1: non-retina', async t => {
  t.context.outputPath = await convert(Format.av1, {
    shouldMute: false,
    inputPath: input,
    fps: 10,
    width: 255,
    height: 143,
    startTime: 11.5,
    endTime: 16,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  // Makes dimensions even
  t.is(meta.size.width, 256);
  t.is(meta.size.height, 144);

  t.is(meta.fps, 10);
  t.true(almostEquals(meta.duration, 4.5));
  t.is(meta.encoding, 'av1');

  t.false(meta.hasAudio);
});

// HEVC

test('HEVC: retina', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert(Format.hevc, {
    shouldMute: true,
    inputPath: retinaInput,
    fps: 15,
    width: 469,
    height: 839,
    startTime: 30,
    endTime: 43.5,
    shouldCrop: true,
    onProgress
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  // Makes dimensions even
  t.is(meta.size.width, 470);
  t.is(meta.size.height, 840);

  t.is(meta.fps, 15);
  t.is(meta.encoding, 'hevc');

  t.false(meta.hasAudio);

  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.string, sinon.match.number, sinon.match.string));
});

test('HEVC: non-retina', async t => {
  t.context.outputPath = await convert(Format.hevc, {
    shouldMute: true,
    inputPath: input,
    fps: 15,
    width: 255,
    height: 143,
    startTime: 11.5,
    endTime: 27,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  // Makes dimensions even
  t.is(meta.size.width, 256);
  t.is(meta.size.height, 144);

  t.is(meta.fps, 15);
  t.is(meta.encoding, 'hevc');

  t.false(meta.hasAudio);
});
