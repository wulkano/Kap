'use strict';

import {BrowserWindow, dialog} from 'electron';
import {ShareServiceContext} from '../../service-context';
import settings from '../../common/settings';
import makeDir from 'make-dir';
import {Format} from '../../common/types';
import path from 'path';

const {Notification, shell} = require('electron');
const moveFile = require('move-file');

const action = async (context: ShareServiceContext & {targetFilePath: string}) => {
  const temporaryFilePath = await context.filePath();

  // Execution has been interrupted
  if (context.isCanceled) {
    return;
  }

  await moveFile(temporaryFilePath, context.targetFilePath);

  const notification = new Notification({
    title: 'File saved successfully!',
    body: 'Click to show the file in Finder'
  });

  notification.on('click', () => {
    shell.showItemInFolder(context.targetFilePath);
  });

  notification.show();
};

const saveFile = {
  title: 'Save to Disk',
  formats: [
    'gif',
    'mp4',
    'webm',
    'apng',
    'av1'
  ],
  action
};

export const shareServices = [saveFile];

const filterMap = new Map([
  [Format.mp4, [{name: 'Movies', extensions: ['mp4']}]],
  [Format.webm, [{name: 'Movies', extensions: ['webm']}]],
  [Format.gif, [{name: 'Images', extensions: ['gif']}]],
  [Format.apng, [{name: 'Images', extensions: ['apng']}]],
  [Format.av1, [{name: 'Movies', extensions: ['mp4']}]]
]);

let lastSavedDirectory: string;

export const askForTargetFilePath = async (
  window: BrowserWindow,
  format: Format,
  fileName: string
) => {
  const kapturesDir = settings.get('kapturesDir');
  await makeDir(kapturesDir);

  const defaultPath = path.join(lastSavedDirectory ?? kapturesDir, fileName);

  console.log('y u no work', fileName);
  console.log(window);
  console.log(defaultPath);

  const filters = filterMap.get(format);

  const {filePath} = await dialog.showSaveDialog(window, {
    title: fileName,
    defaultPath,
    filters
  });

  if (filePath) {
    lastSavedDirectory = path.dirname(filePath);
    return filePath;
  }

  return undefined;
}

