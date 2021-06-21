import ffmpeg from 'ffmpeg-static';
import util from 'electron-util';

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg);

export default ffmpegPath;
