'use strict';

const os = require('os');
const path = require('path');
const execa = require('execa');
const moment = require('moment');
const tmp = require('tmp');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const util = require('electron-util');
const PCancelable = require('p-cancelable');
const tempy = require('tempy');

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);
const durationRegex = /Duration: (\d\d:\d\d:\d\d.\d\d)/gm;
const frameRegex = /frame=\s+(\d+)/gm;

// https://trac.ffmpeg.org/ticket/309
const makeEven = n => 2 * Math.round(n / 2);

const convert = (outputPath, opts, args) => {
  return new PCancelable((resolve, reject, onCancel) => {
    const converter = execa(ffmpegPath, args);
    let amountOfFrames;

    onCancel(() => {
      converter.kill();
    });

    let stderr = '';
    converter.stderr.setEncoding('utf8');
    converter.stderr.on('data', data => {
      stderr += data;

      data = data.trim();
      const matchesDuration = durationRegex.exec(data);
      const matchesFrame = frameRegex.exec(data);

      if (matchesDuration) {
        amountOfFrames = Math.ceil(moment.duration(matchesDuration[1]).asSeconds() * 30);
      } else if (matchesFrame) {
        const currentFrame = matchesFrame[1];
        opts.onProgress(currentFrame / amountOfFrames);
      }
    });

    converter.on('error', reject);

    converter.on('exit', code => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg exited with code: ${code}\n\n${stderr}`));
      }
    });

    converter.catch(reject);
  });
};

const mute = async inputPath => {
  const mutedPath = tmp.tmpNameSync({postfix: path.extname(inputPath)});
  await execa(ffmpegPath, [
    '-i', inputPath,
    '-an',
    '-vcodec', 'copy',
    mutedPath
  ]);
  return mutedPath;
};

const convertToMp4 = async opts => {
  if (opts.muted) {
    opts.inputPath = await mute(opts.inputPath);
  }

  return convert(opts.outputPath, opts, [
    '-i', opts.inputPath,
    '-r', opts.fps,
    '-s', `${makeEven(opts.width)}x${makeEven(opts.height)}`,
    '-ss', opts.startTime,
    '-to', opts.endTime,
    opts.outputPath
  ]);
};

const convertToWebm = async opts => {
  if (opts.muted) {
    opts.inputPath = await mute(opts.inputPath);
  }

  return convert(opts.outputPath, opts, [
    '-i', opts.inputPath,
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
const convertToApng = opts => {
  return convert(opts.outputPath, opts, [
    '-i', opts.inputPath,
    '-vf', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos[x]`,
    // Strange for APNG instead of -loop it uses -plays see: https://stackoverflow.com/questions/43795518/using-ffmpeg-to-create-looping-apng
    `-plays`, opts.loop === true ? '0' : '-1', // 0 == forever; -1 == no loop
    '-ss', opts.startTime,
    '-to', opts.endTime,
    opts.outputPath
  ]);
};

// `time ffmpeg -i original.mp4 -vf fps=30,scale=480:-1::flags=lanczos,palettegen palette.png`
// `time ffmpeg -i original.mp4 -i palette.png -filter_complex 'fps=30,scale=-1:-1:flags=lanczos[x]; [x][1:v]paletteuse' palette.gif`
const convertToGif = PCancelable.fn(async (opts, onCancel) => {
  const palettePath = tmp.tmpNameSync({postfix: '.png'});
  const paletteProcessor = execa(ffmpegPath, [
    '-i', opts.inputPath,
    '-vf', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos,palettegen`,
    palettePath
  ]);

  onCancel(() => {
    paletteProcessor.kill();
  });

  await paletteProcessor;

  return convert(opts.outputPath, opts, [
    '-i', opts.inputPath,
    '-i', palettePath,
    '-filter_complex', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos[x]; [x][1:v]paletteuse`,
    `-loop`, opts.loop === true ? '0' : '-1', // 0 == forever; -1 == no loop
    '-ss', opts.startTime,
    '-to', opts.endTime,
    opts.outputPath
  ]);
});

const converters = new Map([
  ['gif', convertToGif],
  ['mp4', convertToMp4],
  ['webm', convertToWebm],
  ['apng', convertToApng]
]);

const convertTo = (opts, format) => {
  const outputPath = path.join(tempy.directory(), opts.defaultFileName);
  const converter = converters.get(format);
  opts.onProgress(0);

  return converter(Object.assign({outputPath}, opts));
};

module.exports = {
  convertTo,
  converters
};
