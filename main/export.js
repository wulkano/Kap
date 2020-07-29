'use strict';

const path = require('path');
const PCancelable = require('p-cancelable');

const {track} = require('./common/analytics');
const {convertTo} = require('./convert');
const {ShareServiceContext} = require('./service-context');
const PluginConfig = require('./utils/plugin-config');
const {generateTimestampedName} = require('./utils/timestamped-name');

class Export {
  constructor(options) {
    this.exportOptions = options.exportOptions;
    this.inputPath = options.inputPath;
    this.previewPath = options.previewPath;

    this.sharePluginName = options.sharePlugin.pluginName;
    this.sharePlugin = require(options.sharePlugin.pluginPath);
    this.shareService = this.sharePlugin.shareServices.find(shareService => shareService.title === options.sharePlugin.serviceTitle);

    this.shareConfig = new PluginConfig({
      allServices: [this.shareService],
      name: this.sharePluginName
    });

    if (options.editPlugin) {
      this.editPluginName = options.editPlugin.pluginName;
      this.editPlugin = require(options.editPlugin.pluginPath);
      this.editService = this.editPlugin.editServices.find(editService => editService.title === options.editPlugin.title);

      this.editConfig = new PluginConfig({
        allServices: [this.editService],
        name: this.editPluginName
      });
    }

    this.format = options.format;
    this.image = '';
    this.isSaveFileService = options.sharePlugin.pluginName === '_saveToDisk';
    this.disableOutputActions = false;

    const fileName = options.recordingName || (options.isNewRecording ? generateTimestampedName('Kapture') : path.parse(this.inputPath).name);
    this.defaultFileName = `${fileName}.${this.format}`;

    this.context = new ShareServiceContext({
      _isBuiltin: options.sharePlugin.pluginName.startsWith('_'),
      format: this.format,
      defaultFileName: this.defaultFileName,
      config: this.shareConfig,
      onCancel: this.cancel.bind(this),
      onProgress: this.setProgress.bind(this),
      convert: this.convert.bind(this),
      pluginName: this.sharePluginName
    });

    this.run = this.run.bind(this);

    this.setProgress = this.setProgress.bind(this);
    this.cancel = this.cancel.bind(this);
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
    track(`export/started/${this.sharePluginName}`);
    track(`plugins/used/share/${this.sharePluginName}`);
    return new PCancelable(async (resolve, reject, onCancel) => {
      this.resolve = resolve;
      this.reject = reject;

      onCancel(() => this.context.clear());
      try {
        await this.shareService.action(this.context);
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
        onProgress: (percentage, estimate, action = 'Converting') => this.setProgress(estimate ? `${action} — ${estimate} remaining` : `${action}…`, percentage),
        editService: this.editService ? {
          service: this.editService,
          config: this.editConfig,
          cancel: this.cancel,
          setProgress: this.setProgress,
          pluginName: this.editPluginName
        } : undefined
      },
      fileType || this.format
    );

    this.filePath = await this.convertProcess;
    this.resolve();
    return this.filePath;
  }
}

module.exports = Export;
