import {Format} from '../common/types';

const formats = new Map([
  [Format.gif, 'GIF'],
  [Format.hevc, 'MP4 (H265)'],
  [Format.mp4, 'MP4 (H264)'],
  [Format.av1, 'MP4 (AV1)'],
  [Format.webm, 'WebM'],
  [Format.apng, 'APNG']
]);

export const prettifyFormat = (format: Format): string => {
  return formats.get(format)!;
};
