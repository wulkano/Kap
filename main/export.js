'use strict';

const PCancelable = require('p-cancelable');
const moment = require('moment');

const {convertTo} = require('./convert');
const ShareServiceContext = require('./share-service-context');
const Plugin = require('./plugin');

class Export {
  constructor(options) {
    this.exportOptions = options.exportOptions;
    this.inputPath = options.inputPath;
    this.plugin = new Plugin(options.pluginName);
    this.service = this.plugin.getSerivce(options.serviceTitle);
    this.format = options.format;
    this.img = '';

    const now = moment();
    this.defaultFileName = `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.${this.format}`;

    this.context = new ShareServiceContext({
      format: this.format,
      defaultFileName: this.defaultFileName,
      config: this.plugin.getConfig(),
      onCancel: this.cancel.bind(this),
      onProgress: this.setProgress.bind(this),
      convert: this.convert.bind(this)
    });

    this.run = this.run.bind(this);
  }

  get data() {
    return {
      defaultFileName: this.defaultFileName,
      text: this.text,
      status: this.status,
      percentage: this.percentage,
      img: this.img
    };
  }

  run() {
    return new PCancelable((resolve, reject, onCancel) => {
      this.resolve = resolve;
      this.reject = reject;

      this.service.action(this.context)
        .then(() => {
          if (!this.canceled) {
            this.updateExport({text: 'Export completed', status: 'completed', percentage: undefined});
          }
          resolve();
        })
        .catch(reject);

      onCancel(() => this.context.clear());
    });
  }

  cancel() {
    this.updateExport({text: 'Export canceled', status: 'canceled', percentage: undefined});
    this.canceled = true;

    if (this.resolve) {
      this.context.clear();

      if (this.convertProcess) {
        this.convertProcess.cancel();
      }

      this.resolve();
    }
  }

  setProgress(text, percentage) {
    this.updateExport({text, percentage, status: 'processing'});
  }

  convert() {
    this.convertProcess = convertTo(
      Object.assign(
        {},
        this.exportOptions,
        {
          defaultFileName: this.defaultFileName,
          inputPath: this.inputPath,
          onProgress: percentage => this.setProgress('Converting…', percentage)
        }
      ),
      this.format
    );

    return this.convertProcess
      .then(filePath => {
        this.resolve();
        return filePath;
      })
      .catch(error => {
        if (!this.convertProcess.isCanceled) {
          this.reject(error);
        }
      });
  }
}

module.exports = Export;
