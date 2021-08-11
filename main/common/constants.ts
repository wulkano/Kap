import {Format} from './types';

export const supportedVideoExtensions = ['mp4', 'mov', 'm4v'];

const formatExtensions = new Map([
  ['av1', 'mp4'],
  ['hevc', 'mp4']
]);

export const formats = [Format.mp4, Format.hevc, Format.av1, Format.gif, Format.apng, Format.webm];

export const getFormatExtension = (format: Format) => formatExtensions.get(format) ?? format;

export const defaultInputDeviceId = 'SYSTEM_DEFAULT';
