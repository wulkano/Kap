'use strict';

const test = require('ava');
const uniqueString = require('unique-string');
const fs = require('fs');
const sinon = require('sinon');
const path = require('path');

const {getVideoMetadata} = require('./helpers/video-utils');
const {almostEquals} = require('./helpers/assertions');

const getRandomFileName = (ext = 'mp4') => `${uniqueString()}.${ext}`;

const input = path.resolve(__dirname, 'fixtures', 'input.mp4');
const retinaInput = path.resolve(__dirname, 'fixtures', 'input@2x.mp4');

const {mockImport} = require('./helpers/mocks');

mockImport('./common/analytics', 'analytics');
mockImport('./service-context', 'service-context');

const {convertTo} = require('../main/convert');

test.afterEach.always(t => {
  if (t.context.outputPath && fs.existsSync(t.context.outputPath)) {
    fs.unlinkSync(t.context.outputPath);
  }
});

const convert = (format, options) => {
  return convertTo({
    defaultFileName: getRandomFileName(format),
    onProgress: sinon.fake(),
    ...options
  }, format);
};

// MP4

test('mp4: retina with sound', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert('mp4', {
    isMuted: false,
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

  t.true(onProgress.calledWithMatch(sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.number, sinon.match.string));
});

test('mp4: retina without sound', async t => {
  t.context.outputPath = await convert('mp4', {
    isMuted: true,
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
  t.context.outputPath = await convert('mp4', {
    isMuted: false,
    inputPath: input,
    fps: 30,
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

  t.is(meta.fps, 30);
  t.true(almostEquals(meta.duration, 15.5));
  t.is(meta.encoding, 'h264');

  t.false(meta.hasAudio);
});

// WEBM

test('webm: retina with sound', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert('webm', {
    isMuted: false,
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

  t.is(meta.size.width, 469);
  t.is(meta.size.height, 839);

  t.is(meta.fps, 39);
  t.true(almostEquals(meta.duration, 13.5));
  t.is(meta.encoding, 'vp9');

  t.true(meta.hasAudio);

  t.true(onProgress.calledWithMatch(sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.number, sinon.match.string));
});

test('webm: retina without sound', async t => {
  t.context.outputPath = await convert('webm', {
    isMuted: true,
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
  t.context.outputPath = await convert('webm', {
    isMuted: false,
    inputPath: input,
    fps: 30,
    width: 255,
    height: 143,
    startTime: 11.5,
    endTime: 27,
    shouldCrop: true
  });

  const meta = await getVideoMetadata(t.context.outputPath);

  t.is(meta.size.width, 255);
  t.is(meta.size.height, 143);

  t.is(meta.fps, 30);
  t.true(almostEquals(meta.duration, 15.5));
  t.is(meta.encoding, 'vp9');

  t.false(meta.hasAudio);
});

// APNG

test('apng: retina', async t => {
  const onProgress = sinon.fake();

  t.context.outputPath = await convert('apng', {
    isMuted: false,
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

  t.true(onProgress.calledWithMatch(sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.number, sinon.match.string));
});

test('apng: non-retina', async t => {
  t.context.outputPath = await convert('apng', {
    isMuted: false,
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

  t.context.outputPath = await convert('gif', {
    isMuted: false,
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

  t.true(onProgress.calledWithMatch(sinon.match.number));
  t.true(onProgress.calledWithMatch(sinon.match.number, sinon.match.string));
});

test('gif: non-retina', async t => {
  t.context.outputPath = await convert('gif', {
    isMuted: false,
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
