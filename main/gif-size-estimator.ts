import PCancelable from 'p-cancelable';
import fs from 'fs';
import tempy from 'tempy';
import {convert, compress} from './converters/process';
import {conditionalArgs} from './converters/utils';
import {settings} from './common/settings';

export interface GifSizeEstimateOptions {
  inputPath: string;
  startTime: number;
  endTime: number;
  width: number;
  height: number;
  fps: number;
  shouldMute: boolean;
}

/**
 * Estimates the size of a GIF by sampling a portion of the video
 * Uses the same conversion process as the actual GIF conversion
 */
export const estimateGifSize = PCancelable.fn(async (
  options: GifSizeEstimateOptions,
  onCancel: PCancelable.OnCancelFunction
): Promise<number> => {
  const {
    inputPath,
    startTime,
    endTime,
    width,
    height,
    fps
  } = options;

  const duration = endTime - startTime;

  // Sample up to 2 seconds for estimation
  const sampleDuration = Math.min(2, duration);
  const sampleEndTime = startTime + sampleDuration;

  const palettePath = tempy.file({extension: 'png'});
  const outputPath = tempy.file({extension: 'gif'});

  let isCanceled = false;

  const cleanup = async () => {
    try {
      if (fs.existsSync(palettePath)) {
        await fs.promises.unlink(palettePath);
      }
    } catch {}

    try {
      if (fs.existsSync(outputPath)) {
        await fs.promises.unlink(outputPath);
      }
    } catch {}
  };

  onCancel(() => {
    isCanceled = true;
    cleanup();
  });

  try {
    // Generate palette for the sample
    const paletteProcess = convert(palettePath, {shouldTrack: false}, conditionalArgs(
      '-i', inputPath,
      '-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos,palettegen`,
      '-ss', startTime.toString(),
      '-to', sampleEndTime.toString(),
      palettePath
    ));

    onCancel(() => {
      paletteProcess.cancel();
    });

    await paletteProcess;

    if (isCanceled) {
      return 0;
    }

    // Check if palette was generated
    const hasPalette = fs.existsSync(palettePath);
    const shouldLoop = settings.get('loopExports');

    // Convert the sample to GIF
    const conversionProcess = convert(outputPath, {
      shouldTrack: false,
      startTime,
      endTime: sampleEndTime
    }, conditionalArgs(
      '-i', inputPath,
      {
        args: [
          '-i',
          palettePath,
          '-filter_complex',
          `fps=${fps},scale=${width}:${height}:flags=lanczos[x]; [x][1:v]paletteuse`
        ],
        if: hasPalette
      },
      {
        args: [
          '-vf',
          `fps=${fps},scale=${width}:${height}:flags=lanczos`
        ],
        if: !hasPalette
      },
      '-loop', shouldLoop ? '0' : '-1',
      '-ss', startTime.toString(),
      '-to', sampleEndTime.toString(),
      outputPath
    ));

    onCancel(() => {
      conversionProcess.cancel();
    });

    await conversionProcess;

    if (isCanceled) {
      return 0;
    }

    // Compress the sample with gifsicle
    const compressProcess = compress(outputPath, {
      shouldTrack: false,
      startTime,
      endTime: sampleEndTime
    }, [
      '--batch',
      outputPath
    ]);

    onCancel(() => {
      compressProcess.cancel();
    });

    await compressProcess;

    if (isCanceled) {
      return 0;
    }

    // Get the size of the compressed sample
    const {size: sampleSize} = await fs.promises.stat(outputPath);

    // Clean up temporary files
    await cleanup();

    // Extrapolate to full duration
    const estimatedSize = Math.round((sampleSize / sampleDuration) * duration);

    return estimatedSize;
  } catch (error) {
    await cleanup();
    throw error;
  }
});
