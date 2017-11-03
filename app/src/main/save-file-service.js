import {app, dialog} from 'electron';
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

  // TODO: Switch to the async version when we target Electron 1.8
  moveFile.sync(await context.filePath(), filePath);
};

module.exports = {
  title: 'Save to Disk',
  formats: [
    'gif',
    'mp4',
    'webm',
    'apng'
  ],
  action
};
