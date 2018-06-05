const ipc = require('electron-better-ipc');
const base64Img = require('base64-img');
const tmp = require('tmp');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const util = require('electron-util');
const execa = require('execa');

const {getExportsWindow} = require('./exports');
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
    this.currentExport.run()
      .then(() => {
        delete this.currentExport;
        this._startNext();
      })
      .catch(() => {
        this.currentExport.updateExport({
          status: 'failed',
          text: 'Export failed'
        });
        delete this.currentExport;
        this._startNext();
      });
  }

  async cancelExport(createdAt) {
    if (this.currentExport.createdAt === createdAt) {
      this.currentExport.cancel();
      delete this.currentExport;
      this._startNext();
    } else {
      const index = this.queue.findIndex(exp => exp.createdAt === createdAt);
      if (index > -1) {
        this.queue[index].cancel();
        this.queue.splice(index, 1);
      }
    }
  }

  async addExport() {
    const options = {
      exportOptions: {
        width: 1200,
        height: 800,
        fps: 30,
        loop: false
      },
      inputPath: '/Users/george/workspace/asd.mp4',
      pluginName: 'kap-draggable',
      serviceTitle: 'Drag and Drop',
      format: 'mp4'
    };

    const newExport = new Export(options);
    const createdAt = (new Date()).toISOString();

    newExport.status = 'waiting';
    newExport.text = 'Waiting…';
    newExport.img = await getPreview(options.inputPath);
    newExport.createdAt = createdAt;

    callExportsWindow('update-export', Object.assign({}, newExport.data, {createdAt}));

    newExport.updateExport = updates => {
      if (newExport.canceled) {
        return;
      }

      for (const key in updates) {
        if (updates[key]) {
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
}

let exportList;

ipc.answerRenderer('get-exports', () => exportList.getExports());

ipc.answerRenderer('export', () => exportList.addExport().catch(err => console.log('ERRR ', err)));

ipc.answerRenderer('cancel-export', createdAt => exportList.cancelExport(createdAt).catch(err => console.log('ERRR ', err)));

const callExportsWindow = (channel, data) => {
  const exportsWindow = getExportsWindow();

  if (exportsWindow) {
    ipc.callRenderer(exportsWindow, channel, data);
  }
};

module.exports = () => {
  exportList = new ExportList();
};
