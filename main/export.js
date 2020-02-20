'use strict';

const path = require('path');
const PCancelable = require('p-cancelable');
const moment = require('moment');

const {track} = require('./common/analytics');
const {convertTo} = require('./convert');
const ShareServiceContext = require('./share-service-context');
const PluginConfig = require('./utils/plugin-config');

class Export {
  constructor(options) {
    this.exportOptions = options.exportOptions;
    this.inputPath = options.inputPath;
    this.previewPath = options.previewPath;
    this.pluginName = options.plugin.pluginName;

    this.plugin = require(options.plugin.pluginPath);
    this.service = this.plugin.shareServices.find(shareService => shareService.title === options.serviceTitle);

    this.format = options.format;
    this.image = '';
    this.isSaveFileService = options.plugin.pluginName === '_saveToDisk';
    this.disableOutputActions = false;

    const now = moment();
    this.defaultFileName = options.isNewRecording ? `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.${this.format}` : `${path.parse(this.inputPath).name}.${this.format}`;
    this.config = new PluginConfig({
      allServices: [this.service],
      name: this.pluginName
    });

    this.context = new ShareServiceContext({
      _isBuiltin: options.plugin.pluginName.startsWith('_'),
      format: this.format,
      defaultFileName: this.defaultFileName,
      config: this.config,
      onCancel: this.cancel.bind(this),
      onProgress: this.setProgress.bind(this),
      convert: this.convert.bind(this),
      pluginName: this.pluginName
    });

    this.run = this.run.bind(this);
  }

  get data() {
    return {
      defaultFileName: this.isSaveFileService ? path.basename(this.context.targetFilePath) : this.defaultFileName,
      text: this.text,
      status: this.status,
      percentage: this.percentage || 0,
      image: this.image,
      createdAt: this.createdAt,
      filePath: this.filePath && (this.isSaveFileService ? this.context.targetFilePath : this.filePath),
      error: this.error,
      disableOutputActions: this.disableOutputActions
    };
  }

  run() {
    track(`export/started/${this.pluginName}`);
    return new PCancelable(async (resolve, reject, onCancel) => {
      this.resolve = resolve;
      this.reject = reject;

      onCancel(() => this.context.clear());
      try {
        await this.service.action(this.context);
        if (!this.canceled) {
          this.updateExport({
            text: 'Export completed',
            status: 'completed',
            percentage: undefined
          });
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  cancel() {
    this.updateExport({
      text: 'Export canceled',
      status: 'canceled',
      percentage: undefined
    });
    this.canceled = true;

    if (this.resolve) {
      this.context.clear();

      if (this.convertProcess) {
        this.convertProcess.cancel();
      }

      this.resolve();
    }
  }

  setProgress(text, percentage = 0) {
    this.updateExport({
      text, percentage,
      status: 'processing'
    });
  }

  async convert({fileType} = {}) {
    if (fileType) {
      this.disableOutputActions = true;
    }

    this.convertProcess = convertTo(
      {
        ...this.exportOptions,
        defaultFileName: fileType ? `${path.parse(this.defaultFileName).name}.${fileType}` : this.defaultFileName,
        inputPath: this.inputPath,
        onProgress: (percentage, estimate) => this.setProgress(estimate ? `Converting — ${estimate} remaining` : 'Converting…', percentage)
      },
      fileType || this.format
    );

    this.filePath = await this.convertProcess;
    this.resolve();
    return this.filePath;
  }
}

module.exports = Export;
