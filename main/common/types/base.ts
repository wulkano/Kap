import {Rectangle} from 'electron';

export enum Format {
  gif = 'gif',
  hevc = 'hevc',
  mp4 = 'mp4',
  webm = 'webm',
  apng = 'apng',
  av1 = 'av1'
}

export enum Encoding {
  h264 = 'h264',
  hevc = 'hevc',
  // eslint-disable-next-line unicorn/prevent-abbreviations
  proRes422 = 'proRes422',
  // eslint-disable-next-line unicorn/prevent-abbreviations
  proRes4444 = 'proRes4444'
}

export type App = {
  url: string;
  isDefault: boolean;
  icon: string;
  name: string;
};

export interface ApertureOptions {
  fps: number;
  cropArea: Rectangle;
  showCursor: boolean;
  highlightClicks: boolean;
  screenId: number;
  audioDeviceId?: string;
  videoCodec?: Encoding;
}

export interface StartRecordingOptions {
  cropperBounds: Rectangle;
  screenBounds: Rectangle;
  displayId: number;
}
