/* eslint-disable array-element-newline */

import path from 'path';
import execa from 'execa';
import tempy from 'tempy';
import {track} from '../common/analytics';
import ffmpegPath from './ffmpeg-path';

export const getEncoding = async (filePath: string) => {
  try {
    await execa(ffmpegPath, ['-i', filePath]);
    return undefined;
  } catch (error) {
    return /.*: Video: (.*?) \(.*/.exec(error.stderr)?.[1];
  }
};

// `ffmpeg -i original.mp4 -vcodec libx264 -crf 27 -preset veryfast -c:a copy output.mp4`
export const convertToH264 = async (inputPath: string) => {
  const outputPath = tempy.file({extension: path.extname(inputPath)});

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
