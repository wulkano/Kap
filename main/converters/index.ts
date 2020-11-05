import path from 'path';
import tempy from 'tempy';
import {Encoding, Format} from '../common/types';
import {track} from '../common/analytics';
import h264Converters from './h264';
import {ConvertOptions} from './utils';

const converters = new Map([
  [Encoding.h264, h264Converters]
]);

export const convertTo = (format: Format, options: Omit<ConvertOptions, 'outputPath'> & {defaultFileName: string}, encoding: Encoding = Encoding.h264) => {
  if (!converters.has(encoding)) {
    throw new Error(`Unsupported encoding: ${encoding}`);
  }

  const converter = converters.get(encoding)?.get(format);

  if (!converter) {
    throw new Error(`Unsupported file format for ${encoding}: ${format}`);
  }

  track(`file/export/encoding/${encoding}`);
  track(`file/export/format/${format}`);

  // TODO: fill in edit service

  return converter({
    outputPath: path.join(tempy.directory(), options.defaultFileName),
    ...options,
  });
};
