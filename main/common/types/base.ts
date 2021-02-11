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

export type App = {
  url: string;
  isDefault: boolean;
  icon: string;
  name: string;
}
