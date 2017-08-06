import path from 'path';
import {app} from 'electron';
import tempy from 'tempy';
import {convertToGif, convertToMp4, convertToWebm, convertToApng} from '../scripts/convert';

// `exportOptions` => format filePath width height fps loop, defaultFileName
export default async function (exportOptions) {
  const format = exportOptions.format;

  let convert;
  if (format === 'gif') {
    convert = convertToGif;
  } else if (format === 'mp4') {
    convert = convertToMp4;
  } else if (format === 'webm') {
    convert = convertToWebm;
  } else if (format === 'apng') {
    convert = convertToApng;
  }

  const outputPath = path.join(tempy.directory(), exportOptions.defaultFileName);

  await convert({
    filePath: exportOptions.filePath, // TODO: Rename `filePath` to `inputPath`
    outputPath,
    width: exportOptions.width,
    height: exportOptions.height,
    fps: exportOptions.fps,
    loop: exportOptions.loop,
    startTime: exportOptions.startTime,
    endTime: exportOptions.endTime,
    progressCallback: percentage => {
      app.kap.mainWindow.send('export-progress', {
        text: 'Converting…',
        percentage
      });
    }
  });

  app.kap.mainWindow.send('export-progress', {text: ''});

  return outputPath;
}
