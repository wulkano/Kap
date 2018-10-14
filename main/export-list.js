/* eslint-disable array-element-newline */
'use strict';

const {dialog} = require('electron');
const ipc = require('electron-better-ipc');
const base64Img = require('base64-img');
const tmp = require('tmp');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const util = require('electron-util');
const execa = require('execa');
const makeDir = require('make-dir');

const settings = require('./common/settings');
const {track} = require('./common/analytics');
const {openPrefsWindow} = require('./preferences');
const {showExportsWindow, getExportsWindow, openExportsWindow, closeExportsWindow} = require('./exports');
const {openEditorWindow} = require('./editor');
const {toggleExportMenuItem} = require('./menus');
const Export = require('./export');

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);

const filterMap = new Map([
  ['mp4', [{name: 'Movies', extensions: ['mp4']}]],
  ['webm', [{name: 'Movies', extensions: ['webm']}]],
  ['gif', [{name: 'Images', extensions: ['gif']}]],
  ['apng', [{name: 'Images', extensions: ['apng']}]]
]);

const getPreview = async inputPath => {
  const previewPath = tmp.tmpNameSync({postfix: '.jpg'});
  await execa(ffmpegPath, [
    '-ss', 0,
    '-i', inputPath,
    '-t', 1,
    '-vframes', 1,
    '-f', 'image2',
    previewPath
  ]);

  return base64Img.base64Sync(previewPath);
};

const saveSnapshot = async ({inputPath, outputPath, time}) => {
  await execa(ffmpegPath, [
    '-i', inputPath,
    '-ss', time,
    '-vframes', 1,
    outputPath
  ]);
};

class ExportList {
  constructor() {
    this.exports = [];
    this.queue = [];
  }

  _startNext() {
    if (this.queue.length === 0) {
      return;
    }

    this.currentExport = this.queue.shift();
    if (this.currentExport.canceled) {
      this._startNext();
      return;
    }

    (async () => {
      try {
        await this.currentExport.run();
        delete this.currentExport;
        this._startNext();
      } catch (error) {
        console.log(error);
        this.currentExport.updateExport({
          status: 'failed',
          text: 'Export failed',
          error: error.stack
        });
        delete this.currentExport;
        this._startNext();
      }
    })();
  }

  cancelExport(createdAt) {
    if (this.currentExport && this.currentExport.createdAt === createdAt) {
      track('export/canceled/current');
      this.currentExport.cancel();
      delete this.currentExport;
      this._startNext();
    } else {
      const exportToCancel = this.exports.find(exp => exp.createdAt === createdAt);
      if (exportToCancel) {
        track('export/canceled/waiting');
        exportToCancel.cancel();
      }
    }
  }

  async addExport(options) {
    const exportWindowVisible = getExportsWindow().isVisible(); // Check if export window is visible
    toggleExportMenuItem(true);
    options.exportOptions.loop = settings.get('loopExports');
    const newExport = new Export(options);
    const createdAt = (new Date()).toISOString();

    if (options.isDefault) {
      showExportsWindow();
      const kapturesDir = settings.get('kapturesDir');
      await makeDir(kapturesDir);

      const filters = filterMap.get(options.format);

      const filePath = dialog.showSaveDialog(getExportsWindow(), {
        title: newExport.defaultFileName,
        defaultPath: `${kapturesDir}/${newExport.defaultFileName}`,
        filters
      });

      if (filePath) {
        newExport.context.targetFilePath = filePath;
      } else {
        if (!exportWindowVisible) { // Don't close exports window if visible already
          closeExportsWindow();
        }
        return;
      }
    }

    if (!newExport.plugin.isConfigValid()) {
      const result = dialog.showMessageBox({
        type: 'error',
        buttons: ['Configure', 'Cancel'],
        defaultId: 0,
        message: 'Error in plugin config',
        detail: `Review the config for the "${options.pluginName}" plugin to continue exporting`,
        cancelId: 1
      });

      track(`export/plugin/invalid/${options.pluginName}`);

      if (result === 0) {
        const prefsWindow = await openPrefsWindow();
        ipc.callRenderer(prefsWindow, 'open-plugin-config', options.pluginName);
      }

      return;
    }

    newExport.status = 'waiting';
    newExport.text = 'Waiting…';
    newExport.image = await getPreview(options.inputPath);
    newExport.createdAt = createdAt;
    newExport.originalFps = options.originalFps;

    callExportsWindow('update-export', {...newExport.data, createdAt});
    showExportsWindow();

    newExport.updateExport = updates => {
      if (newExport.canceled) {
        return;
      }

      for (const key in updates) {
        if (updates[key] !== undefined) {
          newExport[key] = updates[key];
        }
      }

      callExportsWindow('update-export', {...newExport.data, createdAt});
    };

    this.exports.push(newExport);
    this.queue.push(newExport);
    track(`export/queued/${this.queue.length}`);

    if (!this.currentExport) {
      this._startNext();
    }
  }

  getExports() {
    return this.exports.map(exp => exp.data);
  }

  openExport(createdAt) {
    track('export/history/opened/recording');
    const exp = this.exports.find(exp => exp.createdAt === createdAt);
    if (exp) {
      openEditorWindow(exp.inputPath, exp.originalFps);
    }
  }
}

let exportList;

ipc.answerRenderer('get-exports', () => exportList.getExports());

ipc.answerRenderer('export', options => exportList.addExport(options));

ipc.answerRenderer('cancel-export', createdAt => exportList.cancelExport(createdAt));

ipc.answerRenderer('open-export', createdAt => exportList.openExport(createdAt));

ipc.answerRenderer('export-snapshot', saveSnapshot);

const callExportsWindow = (channel, data) => {
  const exportsWindow = getExportsWindow();

  if (exportsWindow) {
    ipc.callRenderer(exportsWindow, channel, data);
  }
};

module.exports = () => {
  exportList = new ExportList();
  openExportsWindow(false);
};
