/* eslint-disable array-element-newline */
'use strict';
const {dialog, BrowserWindow, app} = require('electron');
const fs = require('fs');
const {dirname} = require('path');
const {ipcMain: ipc} = require('electron-better-ipc');
const base64Img = require('base64-img');
const tmp = require('tmp');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const util = require('electron-util');
const execa = require('execa');
const makeDir = require('make-dir');
const moment = require('moment');

const settings = require('./common/settings');
const {track} = require('./common/analytics');
const {openPrefsWindow} = require('./preferences');
const {getExportsWindow, openExportsWindow} = require('./exports');
const {openEditorWindow} = require('./editor');
const {toggleExportMenuItem} = require('./menus');
const Export = require('./export');

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);
let lastSavedDirectory;

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

  return previewPath;
};

const getDragIcon = async inputPath => {
  const iconPath = tmp.tmpNameSync({postfix: '.jpg'});
  await execa(ffmpegPath, [
    '-i', inputPath,
    // Scale the largest dimension to 64px maintaining aspect ratio
    '-vf', 'scale=if(gte(iw\\,ih)\\,min(64\\,iw)\\,-2):if(lt(iw\\,ih)\\,min(64\\,ih)\\,-2)',
    iconPath
  ]);

  return iconPath;
};

const saveSnapshot = async ({inputPath, time}) => {
  const now = moment();

  const {filePath: outputPath} = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    defaultPath: `Snapshot ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.jpg`
  });

  if (outputPath) {
    await execa(ffmpegPath, [
      '-i', inputPath,
      '-ss', time,
      '-vframes', 1,
      outputPath
    ]);
  }
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
      delete this.currentExport;
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
    } else {
      const exportToCancel = this.exports.find(exp => exp.createdAt === createdAt);
      if (exportToCancel) {
        track('export/canceled/waiting');
        exportToCancel.cancel();
      }
    }
  }

  async addExport(options) {
    options.exportOptions.loop = settings.get('loopExports');
    const newExport = new Export(options);
    const createdAt = (new Date()).toISOString();

    if (options.plugin.pluginName === '_saveToDisk') {
      const wasExportsWindowOpen = Boolean(getExportsWindow());
      const exportsWindow = await openExportsWindow();
      const kapturesDir = settings.get('kapturesDir');
      await makeDir(kapturesDir);

      const filters = filterMap.get(options.format);

      const {filePath} = await dialog.showSaveDialog(exportsWindow, {
        title: newExport.defaultFileName,
        defaultPath: `${lastSavedDirectory || kapturesDir}/${newExport.defaultFileName}`,
        filters
      });

      if (filePath) {
        newExport.context.targetFilePath = filePath;
        lastSavedDirectory = dirname(filePath);
      } else {
        if (!wasExportsWindowOpen) {
          exportsWindow.close();
        }

        return;
      }
    } else if (options.plugin.pluginName === '_openWith') {
      newExport.context.appUrl = options.openWithApp.url;
    }

    if (!newExport.config.isConfigValid()) {
      const result = dialog.showMessageBoxSync({
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

    toggleExportMenuItem(true);

    newExport.status = 'waiting';
    newExport.text = 'Waiting…';
    newExport.imagePath = await getPreview(options.inputPath);
    newExport.image = base64Img.base64Sync(newExport.imagePath);
    newExport.createdAt = createdAt;
    newExport.originalFps = options.originalFps;

    callExportsWindow('update-export', {...newExport.data, createdAt});
    openExportsWindow();

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

  getExport(createdAt) {
    return this.exports.find(exp => exp.createdAt === createdAt);
  }

  openExport(createdAt) {
    track('export/history/opened/recording');
    const exp = this.getExport(createdAt);
    if (exp) {
      openEditorWindow(exp.previewPath, {recordedFps: exp.originalFps, originalFilePath: exp.inputPath});
    }
  }
}

let exportList;

ipc.answerRenderer('get-exports', () => exportList.getExports());

ipc.answerRenderer('export', options => exportList.addExport(options));

ipc.answerRenderer('cancel-export', createdAt => exportList.cancelExport(createdAt));

ipc.answerRenderer('open-export', createdAt => exportList.openExport(createdAt));

ipc.answerRenderer('export-snapshot', saveSnapshot);

ipc.on('drag-export', async (event, createdAt) => {
  const exportItem = exportList.getExport(createdAt);
  const file = exportItem && exportItem.data.filePath;

  if (file && fs.existsSync(file)) {
    event.sender.startDrag({
      file,
      icon: await getDragIcon(exportItem.imagePath)
    });
  }
});

const callExportsWindow = (channel, data) => {
  const exportsWindow = getExportsWindow();

  if (exportsWindow) {
    // TODO(karaggeorge): Investigate why `ipc.callRenderer(exportsWindow, channel, data);` is not working here.
    exportsWindow.webContents.send(channel, data);
  }
};

module.exports = () => {
  exportList = new ExportList();

  app.on('before-quit', event => {
    if (exportList.currentExport) {
      openExportsWindow();
      const exportsWindow = getExportsWindow();

      const buttonIndex = dialog.showMessageBoxSync(exportsWindow, {
        type: 'question',
        buttons: [
          'Continue',
          'Quit'
        ],
        defaultId: 1,
        cancelId: 0,
        message: 'Do you want to continue exporting?',
        detail: 'Kap is currently exporting files. If you quit, the export task will be canceled.'
      });

      if (buttonIndex === 1) {
        event.preventDefault();
      }
    }
  });
};
