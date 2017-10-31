import {extname, join} from 'path';
import tempy from 'tempy';
import execa from 'execa';

const ffmpeg = join(__dirname, '..', '..', 'vendor', 'ffmpeg');

const prependZero = n => n < 10 ? `0${n}` : n;

const ffmpegTime = ms => {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms - seconds * 1000; // eslint-disable-line no-mixed-operators

  return `00:00:${prependZero(seconds)}.${milliseconds}`;
};

// Strip first `ms` milliseconds
module.exports = async (filePath, ms) => {
  const extension = extname(filePath).slice(1);
  const strippedPath = tempy.file({extension});

  await execa(ffmpeg, ['-an', '-ss', ffmpegTime(ms), '-i', filePath, '-vcodec', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'baseline', '-level', '3', strippedPath]);

  return strippedPath;
};
