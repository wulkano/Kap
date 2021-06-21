import execa from 'execa';
import ffmpegPath from './ffmpeg-path';

const getFps = async (filePath: string) => {
  try {
    await execa(ffmpegPath, ['-i', filePath]);
    return undefined;
  } catch (error) {
    return /.*, (.*) fp.*/.exec(error.stderr)?.[1];
  }
};

export default getFps;
