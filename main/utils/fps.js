const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const util = require('electron-util');
const execa = require('execa');

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);

module.exports = async filePath => {
  try {
    await execa(ffmpegPath, ['-i', filePath]);
  } catch (error) {
    return /.*, (.*) fp.*/.exec(error.stderr)[1];
  }
};
