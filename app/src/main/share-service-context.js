import electron, {ipcMain} from 'electron';
import got from 'got';
import moment from 'moment';
import convert from './convert';
import {exportProgress} from './export';

export default class ShareServiceContext {
  constructor(exportOptions) {
    this.format = exportOptions.format;

    const now = moment();
    this.defaultFileName = `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.${this.format}`;

    this.filePath = () => convert(Object.assign({}, exportOptions, {
      defaultFileName: this.defaultFileName
    }));
  }

  // TODO: Implement progress reporting
  async request(url, options) {
    const req = got(url, Object.assign({}, options, {useElectronNet: false}));

    ipcMain.on('cancel-export', () => {
      req.cancel();
    });

    return req;
  }

  cancel() {
    this.canceled = true;
  }

  copyToClipboard(text) {
    electron.clipboard.writeText(text);
  }

  notify(text) {
    (new electron.Notification({
      title: this._pluginName,
      body: text
    })).show();
  }

  setProgress(text, percentage) {
    exportProgress({text, percentage});
  }

  openConfigFile() {
    this.config.openInEditor();
  }
}
