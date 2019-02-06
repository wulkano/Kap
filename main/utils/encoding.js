/* eslint-disable array-element-newline */
'use strict';
const path = require('path');
const tmp = require('tmp');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const util = require('electron-util');
const execa = require('execa');

const {track} = require('../common/analytics');

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);

const getEncoding = async filePath => {
  try {
    await execa(ffmpegPath, ['-i', filePath]);
  } catch (error) {
    return /.*: Video: (.*?) \(.*/.exec(error.stderr)[1];
  }
};

const convertToH264 = async inputPath => {
  const outputPath = tmp.tmpNameSync({postfix: path.extname(inputPath)});
  track('encoding/converted/hevc');

  await execa(ffmpegPath, [
    '-i', inputPath,
    '-vcodec', 'libx264',
    '-crf', '27',
    '-preset', 'veryfast',
    '-c:a', 'copy',
    outputPath
  ]);

  return outputPath;
};

// -vcodec libx264 -crf 27 -preset veryfast -c:a copy output.mp4

module.exports = {
  getEncoding,
  convertToH264
};
