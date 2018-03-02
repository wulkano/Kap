import {app, dialog, Notification, shell} from 'electron';
import makeDir from 'make-dir';
import moveFile from 'move-file';

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

  const kapturesDir = app.kap.settings.get('kapturesDir');
  await makeDir(kapturesDir);

  const filePath = dialog.showSaveDialog(app.kap.editorWindow, {
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
  if (!tempFilePath) {
    context.cancel();
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

export default {
  title: 'Save to Disk',
  formats: [
    'gif',
    'mp4',
    'webm',
    'apng'
  ],
  action
};
