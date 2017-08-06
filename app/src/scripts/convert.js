import {join as joinPath} from 'path';
import os from 'os';

import execa from 'execa';
import moment from 'moment';
import tmp from 'tmp';

const ffmpeg = joinPath(__dirname, '..', '..', 'vendor', 'ffmpeg');
const durationRegex = /Duration: (\d\d:\d\d:\d\d.\d\d)/gm;
const frameRegex = /frame=\s+(\d+)/gm;

function convert(outputPath, opts, args) {
  return new Promise((resolve, reject) => {
    const converter = execa(ffmpeg, args);
    let amountOfFrames;

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
}

// `time ffmpeg -i original.mp4 -vf fps=30,scale=480:-1::flags=lanczos,palettegen palette.png`
// `time ffmpeg -i original.mp4 -i palette.png -filter_complex 'fps=30,scale=-1:-1:flags=lanczos[x]; [x][1:v]paletteuse' palette.gif`
function convertToGif(opts) {
  return Promise.resolve().then(() => {
    const palettePath = tmp.tmpNameSync({postfix: '.png'});

    return execa(ffmpeg, [
      '-i', opts.filePath,
      '-vf', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos,palettegen`,
      palettePath
    ])
      .then(() => convert(opts.outputPath, opts, [
        '-i', opts.filePath,
        '-i', palettePath,
        '-filter_complex', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos[x]; [x][1:v]paletteuse`,
        `-loop`, opts.loop === true ? '0' : '-1', // 0 == forever; -1 == no loop
        '-ss', opts.startTime,
        '-to', opts.endTime,
        opts.outputPath
      ]));
  });
}

function convertToMp4(opts) {
  // TODO: Instead of fixing the `file://` prefix here, just store it in a better place in the editor
  opts.progressCallback(0);
  return convert(opts.outputPath, opts, [
    '-i', opts.filePath,
    '-ss', opts.startTime,
    '-to', opts.endTime,
    opts.outputPath
  ]);
}

function convertToWebm(opts) {
  return Promise.resolve().then(() => {
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
      '-ss', opts.startTime,
      '-to', opts.endTime,
      opts.outputPath
    ]);
  });
}

// Should be similiar to the Gif generation
function convertToApng(opts) {
  return Promise.resolve().then(() => {
    return convert(opts.outputPath, opts, [
      '-i', opts.filePath,
      '-vf', `fps=${opts.fps},scale=${opts.width}:${opts.height}:flags=lanczos[x]`,
      // Strange for APNG instead of -loop it uses -plays see: https://stackoverflow.com/questions/43795518/using-ffmpeg-to-create-looping-apng
      `-plays`, opts.loop === true ? '0' : '-1', // 0 == forever; -1 == no loop
      '-ss', opts.startTime,
      '-to', opts.endTime,
      opts.outputPath
    ]);
  });
}

exports.convertToGif = convertToGif;
exports.convertToMp4 = convertToMp4;
exports.convertToWebm = convertToWebm;
exports.convertToApng = convertToApng;
