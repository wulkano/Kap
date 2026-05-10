import fs from 'fs';
import path from 'path';
import PCancelable from 'p-cancelable';
import prettyBytes from 'pretty-bytes';
import {convertTo} from '../converters';
import {ConversionOptions, Format} from '../common/types';
import {Video} from '../video';

const maximumSampleDuration = 2;
const noop = () => undefined;

export const estimateGifSize = PCancelable.fn(async (
  video: Video,
  options: ConversionOptions,
  onCancel: PCancelable.OnCancelFunction
) => {
  const duration = Math.max(options.endTime - options.startTime, 0);

  if (duration === 0) {
    return;
  }

  await video.whenReady();

  const sampleDuration = Math.min(duration, maximumSampleDuration);
  let samplePath: string | undefined;

  const conversionProcess = convertTo(
    Format.gif,
    {
      ...options,
      defaultFileName: `${video.title}-size-estimate`,
      endTime: options.startTime + sampleDuration,
      inputPath: video.filePath,
      onCancel: noop,
      onProgress: noop
    },
    video.encoding
  );

  onCancel(() => {
    conversionProcess.cancel();
  });

  try {
    samplePath = await conversionProcess;
    const {size} = await fs.promises.stat(samplePath);
    return prettyBytes(Math.ceil(size * (duration / sampleDuration)));
  } finally {
    if (samplePath) {
      await fs.promises.unlink(samplePath).catch(noop);
      await fs.promises.rmdir(path.dirname(samplePath)).catch(noop);
    }
  }
});
