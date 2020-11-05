import {App} from './remote-state-types'

export type CreateConversionOptions = {
  filePath: string;
  options: ConversionOptions;
  format: Format;
  plugins: {
    share: {
      pluginName: string;
      serviceTitle: string;
      app?: App
    },
    edit?: {
      pluginName: string;
      serviceTitle: string;
    }
  }
}

export type ConversionOptions = {
  startTime: number;
  endTime: number;
  width: number;
  height: number;
  fps: number;
  shouldCrop: boolean;
  shouldMute: boolean;
}

export enum Format {
  gif = 'gif',
  mp4 = 'mp4',
  webm = 'webm',
  apng = 'apng',
  av1 = 'av1'
}

export enum Encoding {
  h264 = 'h264',
  hevc = 'hevc',
  proRes422 = 'proRes422',
  proRes4444 = 'proRes4444'
}
