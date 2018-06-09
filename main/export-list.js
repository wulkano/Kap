'use strict';

const ipc = require('electron-better-ipc');
const base64Img = require('base64-img');
const tmp = require('tmp');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const util = require('electron-util');
const execa = require('execa');

const {showExportsWindow, getExportsWindow, openExportsWindow} = require('./exports');
const {openEditorWindow} = require('./editor');
const Export = require('./export');

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);

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

class ExportList {
  constructor() {
    this.exports = [];
    this.queue = [];
  }

  async _startNext() {
    if (this.queue.length === 0) {
      return;
    }

    this.currentExport = this.queue.shift();
    if (this.currentExport.canceled) {
      this._startNext();
      return;
    }

    this.currentExport.run()
      .then(() => {
        delete this.currentExport;
        this._startNext();
      })
      .catch(err => {
        console.log(err);
        this.currentExport.updateExport({
          status: 'failed',
          text: 'Export failed'
        });
        delete this.currentExport;
        this._startNext();
      });
  }

  async cancelExport(createdAt) {
    if (this.currentExport && this.currentExport.createdAt === createdAt) {
      this.currentExport.cancel();
      delete this.currentExport;
      this._startNext();
    } else {
      const index = this.exports.findIndex(exp => exp.createdAt === createdAt);
      if (index > -1) {
        this.exports[index].cancel();
      }
    }
  }

  async addExport(options) {
    const newExport = new Export(options);
    const createdAt = (new Date()).toISOString();

    newExport.status = 'waiting';
    newExport.text = 'Waiting…';
    newExport.img = await getPreview(options.inputPath);
    newExport.createdAt = createdAt;
    newExport.originalFps = options.originalFps;

    callExportsWindow('update-export', Object.assign({}, newExport.data, {createdAt}));
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

      callExportsWindow('update-export', Object.assign({}, newExport.data, {createdAt}));
    };

    this.exports.push(newExport);
    this.queue.push(newExport);

    if (!this.currentExport) {
      this._startNext();
    }
  }

  getExports() {
    return this.exports.map(exp => exp.data);
  }

  openExport(createdAt) {
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
