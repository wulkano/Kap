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

// `ffmpeg -i original.mp4 -vcodec libx264 -crf 27 -preset veryfast -c:a copy output.mp4`
const convertHEVCToH264 = async inputPath => {
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

// `ffmpeg -i original.mp4 -vcodec libx264 -crf 27 -preset veryfast -pix_fmt yuv420p output.mp4`
const convertProResToH264 = async inputPath => {
  const outputPath = tmp.tmpNameSync({postfix: path.extname(inputPath)});
  track('encoding/converted/prores');

  await execa(ffmpegPath, [
    '-i', inputPath,
    '-vcodec', 'libx264',
    '-crf', '27',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    outputPath
  ]);

  return outputPath;
};

module.exports = {
  getEncoding,
  convertHEVCToH264,
  convertProResToH264
};
