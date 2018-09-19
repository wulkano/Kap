'use strict';

const {Notification, shell} = require('electron');
const moveFile = require('move-file');

const action = async context => {
  const tempFilePath = await context.filePath();

  // Execution has been interrupted
  if (context.canceled) {
    return;
  }

  await moveFile(tempFilePath, context.targetFilePath);

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
    'apng'
  ],
  action
};

module.exports.shareServices = [saveFile];
