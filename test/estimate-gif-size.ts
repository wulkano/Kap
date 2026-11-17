import test from 'ava';
import {estimateGifSizeBytes, getGifSampleWindow, GIF_SIZE_SAMPLE_SECONDS} from '../main/utils/estimate-gif-size';

test('sample window is the first second of a longer clip', t => {
  const window = getGifSampleWindow({startTime: 2, endTime: 12, fps: 30});
  t.deepEqual(window, {sampleStart: 2, sampleEnd: 3, sampleFrames: 30, totalFrames: 300});
});

test('sample window is the whole clip when it is shorter than a second', t => {
  const window = getGifSampleWindow({startTime: 1, endTime: 1.5, fps: 30});
  t.deepEqual(window, {sampleStart: 1, sampleEnd: 1.5, sampleFrames: 15, totalFrames: 15});
});

test('sample window rounds frame counts', t => {
  const window = getGifSampleWindow({startTime: 0, endTime: 2.5, fps: 24});
  t.is(window.sampleFrames, 24);
  t.is(window.totalFrames, 60);
});

test('estimate scales the sample to the full clip', t => {
  t.is(estimateGifSizeBytes({sampleBytes: 100_000, sampleFrames: 30, totalFrames: 300}), 1_000_000);
});

test('estimate returns the sample size when the clip fits in the sample', t => {
  t.is(estimateGifSizeBytes({sampleBytes: 100_000, sampleFrames: 30, totalFrames: 15}), 100_000);
});

test('estimate returns zero for an empty sample', t => {
  t.is(estimateGifSizeBytes({sampleBytes: 0, sampleFrames: 30, totalFrames: 300}), 0);
  t.is(estimateGifSizeBytes({sampleBytes: 100_000, sampleFrames: 0, totalFrames: 300}), 0);
});

test('sample duration is one second', t => {
  t.is(GIF_SIZE_SAMPLE_SECONDS, 1);
});
