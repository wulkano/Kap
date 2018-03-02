import os from 'os';
import execa from 'execa';
import moment from 'moment';
import tmp from 'tmp';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import util from 'electron-util';
import PCancelable from 'p-cancelable';

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);
const durationRegex = /Duration: (\d\d:\d\d:\d\d.\d\d)/gm;
const frameRegex = /frame=\s+(\d+)/gm;

// https://trac.ffmpeg.org/ticket/309
const makeEven = n => 2 * Math.round(n / 2);

const convert = (outputPath, opts, args) => {
  return new PCancelable((onCancel, resolve, reject) => {
    const converter = execa(ffmpegPath, args);
    let amountOfFrames;

    onCancel(() => {
      converter.kill();
    });

    converter.stderr.on('data', data => {
      data = data.toString().trim();
      const matchesDuration = durationRegex.exec(data);
      const matchesFrame = frameRegex.exec(data);

      if (matchesDuration) {
        amountOfFrames = Math.ceil(moment.duration(matchesDuration[1]).asSeconds() * 30);
      } else if (matchesFrame) {
        const currentFrame = matchesFrame[1];
        opts.progressCallback(currentFrame / amountOfFrames);
      }
    });

    converter.on('error', reject);
    converter.on('exit', code => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(code);
      }
    });

    converter.catch(reject);
  });
};

// `time ffmpeg -i original.mp4 -vf fps=30,scale=480:-1::flags=lanczos,palettegen palette.png`
// `time ffmpeg -i original.mp4 -i palette.png -filter_complex 'fps=30,scale=-1:-1:flags=lanczos[x]; [x][1:v]paletteuse' palette.gif`
export const convertToGif = PCancelable.fn(async (onCancel, opts) => {
  const palettePath = tmp.tmpNameSync({postfix: '.png'});
  const paletteProcessor = execa(ffmpegPath, [
    '-i', opts.filePath,
    '-vf', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos,palettegen`,
    palettePath
  ]);

  onCancel(() => {
    paletteProcessor.kill();
  });

  await paletteProcessor;

  return convert(opts.outputPath, opts, [
    '-i', opts.filePath,
    '-i', palettePath,
    '-filter_complex', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos[x]; [x][1:v]paletteuse`,
    `-loop`, opts.loop === true ? '0' : '-1', // 0 == forever; -1 == no loop
    '-ss', opts.startTime,
    '-to', opts.endTime,
    opts.outputPath
  ]);
});

export const convertToMp4 = opts => {
  opts.progressCallback(0);

  return convert(opts.outputPath, opts, [
    '-i', opts.filePath,
    '-r', opts.fps,
    '-s', `${makeEven(opts.width)}x${makeEven(opts.height)}`,
    '-ss', opts.startTime,
    '-to', opts.endTime,
    opts.outputPath
  ]);
};

export const convertToWebm = opts => {
  return convert(opts.outputPath, opts, [
    '-i', opts.filePath,
    // http://wiki.webmproject.org/ffmpeg
    // https://trac.ffmpeg.org/wiki/Encode/VP9
    '-threads', Math.max(os.cpus().length - 1, 1),
    '-deadline', 'good', // `best` is twice as slow and only slighty better
    '-b:v', '1M', // Bitrate (same as the MP4)
    '-codec:v', 'vp9',
    '-codec:a', 'vorbis',
    '-strict', '-2', // Needed because `vorbis` is experimental
    '-r', opts.fps,
    '-s', `${opts.width}x${opts.height}`,
    '-ss', opts.startTime,
    '-to', opts.endTime,
    opts.outputPath
  ]);
};

// Should be similiar to the Gif generation
export const convertToApng = opts => {
  return convert(opts.outputPath, opts, [
    '-i', opts.filePath,
    '-vf', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos[x]`,
    // Strange for APNG instead of -loop it uses -plays see: https://stackoverflow.com/questions/43795518/using-ffmpeg-to-create-looping-apng
    `-plays`, opts.loop === true ? '0' : '-1', // 0 == forever; -1 == no loop
    '-ss', opts.startTime,
    '-to', opts.endTime,
    opts.outputPath
  ]);
};
