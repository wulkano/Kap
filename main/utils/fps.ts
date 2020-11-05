import util from 'electron-util';
import execa from 'execa';

const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);

const getFps = async (filePath: string) => {
  try {
    await execa(ffmpegPath, ['-i', filePath]);
    return undefined;
  } catch (error) {
    return /.*, (.*) fp.*/.exec(error.stderr)?.[1];
  }
};

export default getFps;
