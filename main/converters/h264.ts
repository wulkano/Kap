import PCancelable from 'p-cancelable';
import tempy from 'tempy';
import {convert, gifski} from './process';
import {areDimensionsEven, conditionalArgs, ConvertOptions, makeEven} from './utils';
import {settings} from '../common/settings';
import os from 'os';
import {Format} from '../common/types';
import fs from 'fs';

// GIF export: trim the clip with ffmpeg if a range is selected, then encode it
// with gifski. gifski reads video directly (its bundled binary statically links
// FFmpeg) and handles fps resampling and scaling itself, so no intermediate image
// frames are needed. It is multithreaded and higher quality than ffmpeg's
// palettegen/paletteuse pipeline, and its binary is universal (x86_64 + arm64) —
// so this also drops the x86_64-only gifsicle dependency that triggered the macOS
// Intel/Rosetta deprecation warning on Apple Silicon.
const convertToGif = PCancelable.fn(async (options: ConvertOptions, onCancel: PCancelable.OnCancelFunction) => {
  const shouldLoop = settings.get('loopExports');
  const useLossy = settings.get('lossyCompression', false);
  // GIF frame delays are stored in 1/100s units, so 50fps (2 centiseconds per
  // frame) is the highest cleanly representable rate. Higher rates such as 60fps
  // can't be stored and get mangled into slow motion, so cap the GIF fps at 50.
  const fps = Math.min(options.fps, 50);

  // Because gifski can't trim, use ffmpeg to cut the selected range into a
  // temporary clip when needed; otherwise hand the input straight to gifski.
  let gifskiInput = options.inputPath;
  let trimmedPath: string | undefined;

  try {
    if (options.shouldCrop) {
      trimmedPath = tempy.file({extension: 'mp4'});

      const trimProcess = convert(trimmedPath, {
        onProgress: (progress, estimate) => {
          options.onProgress('Converting', progress, estimate);
        },
        startTime: options.startTime,
        endTime: options.endTime
      }, conditionalArgs(
        '-i', options.inputPath,
        '-ss', options.startTime.toString(),
        '-to', options.endTime.toString(),
        '-an', // GIFs have no audio track
        '-crf', '18', // Near-lossless intermediate; gifski re-quantizes to GIF anyway
        trimmedPath
      ));

      onCancel(() => {
        trimProcess.cancel();
      });

      await trimProcess;
      gifskiInput = trimmedPath;
    }

    // By default gifski downscales output to ~800x600 unless the target size is
    // set explicitly, so always pass the export dimensions through.
    const gifProcess = gifski(options.outputPath, {}, conditionalArgs(
      '--quiet',
      '--fps', fps.toString(),
      '--quality', useLossy ? '70' : '90',
      '--width', options.width.toString(),
      '--height', options.height.toString(),
      {args: ['--repeat', '-1'], if: !shouldLoop}, // -1 == no loop; gifski's default 0 == loop forever
      '-o', options.outputPath,
      gifskiInput
    ));

    onCancel(() => {
      gifProcess.cancel();
    });

    await gifProcess;

    return options.outputPath;
  } finally {
    // Remove the temporary trimmed clip (if any), whether the export succeeded,
    // failed, or was cancelled.
    if (trimmedPath) {
      fs.rmSync(trimmedPath, {force: true});
    }
  }
});

// eslint-disable-next-line @typescript-eslint/promise-function-async
const convertToMp4 = (options: ConvertOptions) => convert(options.outputPath, {
  onProgress: (progress, estimate) => {
    options.onProgress('Converting', progress, estimate);
  },
  startTime: options.startTime,
  endTime: options.endTime
}, conditionalArgs(
  '-i', options.inputPath,
  '-r', options.fps.toString(),
  {
    args: ['-an'],
    if: options.shouldMute
  },
  {
    args: [
      '-s',
      `${makeEven(options.width)}x${makeEven(options.height)}`,
      '-ss',
      options.startTime.toString(),
      '-to',
      options.endTime.toString()
    ],
    if: options.shouldCrop || !areDimensionsEven(options)
  },
  options.outputPath
));

// eslint-disable-next-line @typescript-eslint/promise-function-async
const convertToWebm = (options: ConvertOptions) => convert(options.outputPath, {
  onProgress: (progress, estimate) => {
    options.onProgress('Converting', progress, estimate);
  },
  startTime: options.startTime,
  endTime: options.endTime
}, conditionalArgs(
  '-i', options.inputPath,
  // http://wiki.webmproject.org/ffmpeg
  // https://trac.ffmpeg.org/wiki/Encode/VP9
  '-threads', Math.max(os.cpus().length - 1, 1).toString(),
  '-deadline', 'good', // `best` is twice as slow and only slighty better
  '-b:v', '1M', // Bitrate (same as the MP4)
  '-codec:v', 'vp9',
  '-codec:a', 'vorbis',
  '-ac', '2', // https://stackoverflow.com/questions/19004762/ffmpeg-covert-from-mp4-to-webm-only-working-on-some-files
  '-strict', '-2', // Needed because `vorbis` is experimental
  '-r', options.fps.toString(),
  {
    args: ['-an'],
    if: options.shouldMute
  },
  {
    args: [
      '-s',
      `${makeEven(options.width)}x${makeEven(options.height)}`,
      '-ss',
      options.startTime.toString(),
      '-to',
      options.endTime.toString()
    ],
    if: options.shouldCrop || !areDimensionsEven(options)
  },
  options.outputPath
));

// eslint-disable-next-line @typescript-eslint/promise-function-async
const convertToAv1 = (options: ConvertOptions) => convert(options.outputPath, {
  onProgress: (progress, estimate) => {
    options.onProgress('Converting', progress, estimate);
  },
  startTime: options.startTime,
  endTime: options.endTime
}, conditionalArgs(
  '-i', options.inputPath,
  '-r', options.fps.toString(),
  '-c:v', 'libaom-av1',
  '-c:a', 'libopus',
  '-crf', '34',
  '-b:v', '0',
  '-strict', 'experimental',
  // Enables row-based multi-threading which maximizes CPU usage
  // https://trac.ffmpeg.org/wiki/Encode/AV1
  '-cpu-used', '4',
  '-row-mt', '1',
  '-tiles', '2x2',
  {
    args: ['-an'],
    if: options.shouldMute
  },
  {
    args: [
      '-s',
      `${makeEven(options.width)}x${makeEven(options.height)}`,
      '-ss',
      options.startTime.toString(),
      '-to',
      options.endTime.toString()
    ],
    if: options.shouldCrop || !areDimensionsEven(options)
  },
  options.outputPath
));

// eslint-disable-next-line @typescript-eslint/promise-function-async
const convertToHevc = (options: ConvertOptions) => convert(options.outputPath, {
  onProgress: (progress, estimate) => {
    options.onProgress('Converting', progress, estimate);
  },
  startTime: options.startTime,
  endTime: options.endTime
}, conditionalArgs(
  '-i', options.inputPath,
  '-r', options.fps.toString(),
  '-c:v', 'libx265',
  '-c:a', 'libopus',
  '-preset', 'medium',
  '-tag:v', 'hvc1', // Metadata for macOS
  {
    args: ['-an'],
    if: options.shouldMute
  },
  {
    args: [
      '-s',
      `${makeEven(options.width)}x${makeEven(options.height)}`,
      '-ss',
      options.startTime.toString(),
      '-to',
      options.endTime.toString()
    ],
    if: options.shouldCrop || !areDimensionsEven(options)
  },
  options.outputPath
));

// eslint-disable-next-line @typescript-eslint/promise-function-async
const convertToApng = (options: ConvertOptions) => convert(options.outputPath, {
  onProgress: (progress, estimate) => {
    options.onProgress('Converting', progress, estimate);
  },
  startTime: options.startTime,
  endTime: options.endTime
}, conditionalArgs(
  '-i', options.inputPath,
  '-vf', `fps=${options.fps}${options.shouldCrop ? `,scale=${options.width}:${options.height}:flags=lanczos` : ''}`,
  // Strange for APNG instead of -loop it uses -plays see: https://stackoverflow.com/questions/43795518/using-ffmpeg-to-create-looping-apng
  '-plays', settings.get('loopExports') ? '0' : '1', // 0 == forever; 1 == no loop
  {
    args: ['-an'],
    if: options.shouldMute
  },
  {
    args: [
      '-ss',
      options.startTime.toString(),
      '-to',
      options.endTime.toString()
    ],
    if: options.shouldCrop
  },
  options.outputPath
));

// eslint-disable-next-line @typescript-eslint/promise-function-async
export const crop = (options: ConvertOptions) => convert(options.outputPath, {
  onProgress: (progress, estimate) => {
    options.onProgress('Cropping', progress, estimate);
  },
  startTime: options.startTime,
  endTime: options.endTime
}, conditionalArgs(
  '-i', options.inputPath,
  '-s', `${makeEven(options.width)}x${makeEven(options.height)}`,
  '-ss', options.startTime.toString(),
  '-to', options.endTime.toString(),
  options.outputPath
));

export default new Map([
  [Format.gif, convertToGif],
  [Format.mp4, convertToMp4],
  [Format.hevc, convertToHevc],
  [Format.webm, convertToWebm],
  [Format.apng, convertToApng],
  [Format.av1, convertToAv1]
]);
