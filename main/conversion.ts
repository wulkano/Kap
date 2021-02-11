import fs from 'fs';
import {app, clipboard} from 'electron';
import {EventEmitter} from 'events';
import {ConversionOptions, ConversionStatus, CreateConversionOptions, Format} from './common/types';
import {Video} from './video';
import {convertTo} from './converters';
import Export, {ExportOptions} from './export';
import hash from 'object-hash';
import {ipcMain} from 'electron-better-ipc';
import plugins from './plugins';
import {askForTargetFilePath} from './plugins/built-in/save-file-plugin';
import path from 'path';
import {showError} from './utils/errors';
import {notify} from './utils/notifications';
import PCancelable from 'p-cancelable';
import prettyBytes from 'pretty-bytes';

const plist = require('plist');

// A conversion object describes the process of converting a video or recording
// using ffmpeg that can then be shared multiple times using Share plugins
export default class Conversion extends EventEmitter {
  static all = new Map<string, Conversion>();

  static fromId(id: string) {
    return this.all.get(id);
  }

  static getOrCreate(video: Video, format: Format, options: ConversionOptions) {
    const id = hash({
      filePath: video.filePath,
      format,
      options
    });

    return this.fromId(id) ?? new Conversion(video, format, options);
  }

  id: string;
  video: Video;
  format: Format;
  options: ConversionOptions;

  text: string = '';
  percentage?: number;
  error?: Error;
  description: string;
  title: string;
  finalSize?: string;
  private currentExport?: Export;
  private convertedFilePath?: string;

  private _status: ConversionStatus = ConversionStatus.idle;

  get status() {
    return this._status;
  }

  get canCopy() {
    console.log('Can copy,', this.convertedFilePath, this.format);
    return Boolean(this.convertedFilePath && [Format.gif, Format.apng].includes(this.format));
  }

  copy = () => {
    console.log('Copy was called', this.convertedFilePath);
    clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(plist.build([this.convertedFilePath])));
    notify({
      body: 'The file has been copied to the clipboard',
      title: app.name
    });
  }

  set status(newStatus: ConversionStatus) {
    this._status = newStatus;
    this.emit('updated');
  }

  private conversionProcess?: PCancelable<string>;

  constructor(video: Video, format: Format, options: ConversionOptions) {
    super();
    this.video = video;
    this.format = format;
    this.options = options;

    this.description = `${this.options.width} x ${this.options.height} at ${this.options.fps} FPS`;
    this.title = path.parse(this.video.filePath).name;

    this.id = hash({
      filePath: video.filePath,
      format,
      options
    });

    Conversion.all.set(this.id, this);
  }

  onProgress = (text: string, progress: number) => {
    this.text = text;
    this.percentage = Math.max(Math.min(progress, 1), 0);
    this.emit('updated');
  }

  private onConversionProgress = (action: string, progress: number, estimate?: string) => {
    console.log('OnConversionProgress was called');
    const text = estimate ? `${action} — ${estimate} remaining` : `${action}…`;
    this.onProgress(text, progress);
  }

  private onExportProgress = (text: string, progress: number) => {
    this.onProgress(text, progress);
  }

  filePath = async ({fileType}: {fileType?: Format} = {}) => {
    console.log(fileType);
    if (!this.conversionProcess) {
      this.start();
    }

    try {
      this.convertedFilePath = await this.conversionProcess;
      return this.convertedFilePath as string;
    } catch (error) {
      // Ensure we re-try the conversion if it fails
      this.conversionProcess = undefined;

      if (!error.isCanceled) {
        throw error;
      }

      return '';
    }
  }

  addExport(exportOptions: ExportOptions) {
    this.status = ConversionStatus.inProgress;
    this.error = undefined;
    this.text = 'Initiating…';
    this.percentage = 0;

    const newExport = new Export(this, exportOptions);

    newExport.on('progress', ({text, percentage}) => this.onExportProgress(text, percentage));
    const cleanup = () => {
      this.currentExport = undefined;
      newExport.off('progress', this.onExportProgress);
    }

    newExport.once('canceled', () => {
      this.onExportProgress('Export canceled', 1);
      cleanup();
      this.status = ConversionStatus.canceled;
      this.emit('updated');
    });

    newExport.once('finished', () => {
      this.onExportProgress('Export completed', 1);
      cleanup();
      this.status = ConversionStatus.completed;
      this.emit('updated');
    });

    newExport.once('error', (error: Error) => {
      showError(error, {plugin: exportOptions.plugin} as any);
      this.onExportProgress('Export failed', 1);
      cleanup();
      this.error = error;
      this.status = ConversionStatus.failed;
      this.emit('updated');
    });

    this.currentExport = newExport;
    console.log('Starting export', newExport);
    newExport.start();
  }

  cancel = () => {
    // Avoid infinite loop
    if (!this.conversionProcess?.isCanceled) {
      this.conversionProcess?.cancel();
    }
    this.currentExport?.onCancel();
  }

  private start = () => {
    console.log('STart called');
    this.conversionProcess = convertTo(
      this.format,
      {
        ...this.options,
        defaultFileName: this.video.title,
        inputPath: this.video.filePath,
        onProgress: this.onConversionProgress,
        onCancel: this.cancel
      },
      this.video.encoding
    );

    this.conversionProcess.then(async filePath => {
      try {
        const {size} = await fs.promises.stat(filePath);
        this.finalSize = prettyBytes(size);
        this.emit('updated');
      } catch {}
    });
  }
}

export const setupConversionHook = () => {
  ipcMain.answerRenderer('create-conversion', async ({
    filePath, options, format, plugins: pluginOptions
  }: CreateConversionOptions, window) => {
    console.log('HERE WITH', filePath, options, format, pluginOptions);
    console.log(window);
    const video = Video.fromId(filePath);
    const extras: {[key: string]: any} = {};

    if (!video) {
      return;
    }

    if (pluginOptions.share.pluginName === '_saveToDisk') {
      const targetFilePath = await askForTargetFilePath(
        window,
        format,
        video.title
      );

      if (targetFilePath) {
        extras.targetFilePath = targetFilePath;

      } else {
        return;
      }
    }

    console.log('Here with', video);

    const exportPlugin = plugins.sharePlugins.find(plugin => {
      return plugin.name === pluginOptions.share.pluginName
    });

    const exportService = exportPlugin?.shareServices.find(service => {
      return service.title === pluginOptions.share.serviceTitle
    });

    if (!exportPlugin || !exportService) {
      return;
    }

    console.log('here', exportPlugin);

    const conversion = Conversion.getOrCreate(video, format, options);

    if (extras.targetFilePath) {
      conversion.title = path.parse(extras.targetFilePath).name;
    }

    conversion.addExport({
      plugin: exportPlugin,
      service: exportService,
      extras
    });

    console.log('queueed', conversion.id);
    return conversion.id;
  });
}
