'use strict';

const moment = require('moment');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const execa = require('execa');

const ffmpegPath = ffmpeg.path;

const getDuration = text => {
  const durationString = /Duration: ([\d:.]*)/.exec(text)[1];
  return moment.duration(durationString).asSeconds();
};

const getEncoding = text => /Stream.*Video: (.*?)[, ]/.exec(text)[1];

const getFps = text => {
  const fpsString = /([\d.]*) fps/.exec(text)[1];
  return Number.parseFloat(fpsString);
};

const getSize = text => {
  const sizeText = /Video:.*?, (\d*x\d*)/.exec(text)[1];
  const parts = sizeText.split('x');
  return {
    width: Number.parseFloat(parts[0]),
    height: Number.parseFloat(parts[1])
  };
};

const getHasAudio = text => /Stream #.*: Audio/.test(text);

module.exports.getVideoMetadata = async path => {
  try {
    await execa(ffmpegPath, ['-i', path]);
  } catch (error) {
    const {stderr} = error;
    return {
      duration: getDuration(stderr),
      encoding: getEncoding(stderr),
      fps: getFps(stderr),
      size: getSize(stderr),
      hasAudio: getHasAudio(stderr)
    };
  }
};
