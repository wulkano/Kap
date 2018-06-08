const {dialog, Notification, shell} = require('electron');
const makeDir = require('make-dir');
const moveFile = require('move-file');
const settings = require('./common/settings');
const {getExportsWindow} = require('./exports');

const action = async context => {
  const format = context.format;

  let filters;
  if (format === 'mp4') {
    filters = [{name: 'Movies', extensions: ['mp4']}];
  } else if (format === 'webm') {
    filters = [{name: 'Movies', extensions: ['webm']}];
  } else if (format === 'gif') {
    filters = [{name: 'Images', extensions: ['gif']}];
  } else {
    filters = [{name: 'Images', extensions: ['apng']}];
  }

  const kapturesDir = settings.get('kapturesDir');
  await makeDir(kapturesDir);

  const filePath = dialog.showSaveDialog(getExportsWindow(), {
    title: context.defaultFileName,
    defaultPath: `${kapturesDir}/${context.defaultFileName}`,
    filters
  });

  if (!filePath) {
    context.cancel();
    return;
  }

  const tempFilePath = await context.filePath();

  // Execution has been interrupted
  if (context.canceled) {
    return;
  }

  // TODO: Switch to the async version when we target Electron 1.8
  moveFile.sync(tempFilePath, filePath);

  const notification = new Notification({
    title: 'File saved successfully!',
    body: 'Click to show the file in Finder'
  });

  notification.on('click', () => {
    shell.showItemInFolder(filePath);
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
