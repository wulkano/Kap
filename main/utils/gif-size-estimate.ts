import fs from 'fs';
import path from 'path';
import PCancelable from 'p-cancelable';
import tempy from 'tempy';
import {ConversionOptions, Format} from '../common/types';
import {convertTo} from '../converters';
import {Video} from '../video';

const maximumSampleCount = 3;
const maximumSampleDuration = 1;
const noop = () => undefined;

export type GifSampleRange = {
  startTime: number;
  endTime: number;
};

export type GifSizeEstimate = {
  bytes: number;
  sampleCount: number;
  sampledDuration: number;
};

export const getGifSampleRanges = (startTime: number, endTime: number): GifSampleRange[] => {
  const duration = endTime - startTime;

  if (!Number.isFinite(duration) || duration <= 0) {
    return [];
  }

  const maximumTotalSampleDuration = maximumSampleCount * maximumSampleDuration;

  if (duration <= maximumTotalSampleDuration) {
    return [{startTime, endTime}];
  }

  const finalSampleStart = endTime - maximumSampleDuration;

  return Array.from({length: maximumSampleCount}, (_, index) => {
    const progress = index / (maximumSampleCount - 1);
    const sampleStartTime = startTime + ((finalSampleStart - startTime) * progress);

    return {
      startTime: sampleStartTime,
      endTime: sampleStartTime + maximumSampleDuration
    };
  });
};

export const extrapolateGifSize = (
  sampleSizes: number[],
  sampleRanges: GifSampleRange[],
  totalDuration: number
) => {
  let sampledDuration = 0;

  for (const sample of sampleRanges) {
    sampledDuration += sample.endTime - sample.startTime;
  }

  if (sampleSizes.length === 0 || sampleSizes.length !== sampleRanges.length || sampledDuration <= 0 || totalDuration <= 0) {
    return;
  }

  let sampledBytes = 0;

  for (const size of sampleSizes) {
    sampledBytes += size;
  }

  return Math.ceil(sampledBytes * (totalDuration / sampledDuration));
};

export const estimateGifSize = PCancelable.fn(async (
  video: Video,
  options: ConversionOptions,
  onCancel: PCancelable.OnCancelFunction
): Promise<GifSizeEstimate | undefined> => {
  const sampleRanges = getGifSampleRanges(options.startTime, options.endTime);

  if (sampleRanges.length === 0) {
    return;
  }

  await video.whenReady();

  const sampleDirectory = tempy.directory();
  const samplePaths: string[] = [];
  const sampleSizes: number[] = [];
  let conversionProcess: ReturnType<typeof convertTo> | undefined;
  let isCanceled = false;

  onCancel(() => {
    isCanceled = true;
    conversionProcess?.cancel();
  });

  try {
    for (const [index, sample] of sampleRanges.entries()) {
      if (isCanceled) {
        return;
      }

      const samplePath = path.join(sampleDirectory, `sample-${index}.gif`);
      samplePaths.push(samplePath);
      conversionProcess = convertTo(
        Format.gif,
        {
          ...options,
          defaultFileName: `sample-${index}`,
          outputPath: samplePath,
          startTime: sample.startTime,
          endTime: sample.endTime,
          inputPath: video.filePath,
          // Estimation is not an export and should not affect conversion analytics.
          shouldTrack: false,
          // Edit services may be interactive or have side effects. The renderer does not
          // request an estimate while one is selected, and this is a final safety net.
          editService: undefined,
          onCancel: noop,
          onProgress: noop
        },
        video.encoding
      );

      await conversionProcess;

      if (isCanceled) {
        return;
      }

      sampleSizes.push((await fs.promises.stat(samplePath)).size);
    }

    const totalDuration = options.endTime - options.startTime;
    const bytes = extrapolateGifSize(sampleSizes, sampleRanges, totalDuration);

    if (bytes === undefined) {
      return;
    }

    let sampledDuration = 0;

    for (const sample of sampleRanges) {
      sampledDuration += sample.endTime - sample.startTime;
    }

    return {
      bytes,
      sampleCount: sampleRanges.length,
      sampledDuration
    };
  } finally {
    await Promise.all(samplePaths.map(async samplePath => fs.promises.unlink(samplePath).catch(noop)));
    await fs.promises.rmdir(sampleDirectory).catch(noop);
  }
});
