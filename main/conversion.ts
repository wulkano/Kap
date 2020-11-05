import {EventEmitter} from 'events';
import {Format} from './common/types';
import {Video} from './video';
import {convertTo} from './converters';
import Export, {ExportOptions} from './export';
import hash from 'object-hash';
import {ipcMain} from 'electron-better-ipc';
import plugins from './plugins';

interface ConversionOptions {
  startTime: number;
  endTime: number;
  width: number;
  height: number;
  fps: number;
  shouldCrop: boolean;
  shouldMute: boolean;
}

enum Status {
  idle,
  inProgress,
  failed,
  canceled,
  completed
}

// A conversion object describes the process of converting a video or recording
// using ffmpeg that can then be shared multiple times using Share plugins
export default class Conversion extends EventEmitter {
  static all = new Map<string, Conversion>();

  static fromId(id: string) {
    return this.all.get(id);
  }

  id: string;
  video: Video;
  format: Format;
  options: ConversionOptions;

  text: string = '';
  percentage?: number;
  error?: Error;

  private _status: Status = Status.idle;

  get status() {
    return this._status;
  }

  set status(newStatus: Status) {
    this._status = newStatus;
    this.emit('updated');
  }

  private conversionProcess?: Promise<string>;

  constructor(video: Video, format: Format, options: ConversionOptions) {
    super();
    this.video = video;
    this.format = format;
    this.options = options;

    this.id = hash({
      filePath: video.filePath,
      format,
      options
    });

    Conversion.all.set(this.id, this);
  }

  onProgress = (text: string, progress: number) => {
    this.text = text;
    this.percentage = progress;
    this.emit('updated');
  }

  private onConversionProgress = (action: string, progress: number, estimate?: string) => {
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
      const filePath = await this.conversionProcess;
      return filePath as string;
    } catch (error) {
      // Ensure we re-try the conversion if it fails
      this.conversionProcess = undefined;
      throw error;
    }
  }

  addExport(exportOptions: ExportOptions) {
    this.status = Status.inProgress;
    this.error = undefined;
    this.text = '';
    this.percentage = 0;

    const newExport = new Export(this, exportOptions);

    newExport.on('progress', this.onExportProgress);
    const cleanup = () => {
      newExport.off('progress', this.onExportProgress);
    }

    newExport.once('canceled', () => {
      cleanup();
      this.status = Status.canceled;
    });

    newExport.once('finished', () => {
      cleanup();
      this.status = Status.completed;
    });

    newExport.once('error', (error: Error) => {
      // showError(error, {plugin: exportOptions.plugin});
      cleanup();
      this.error = error;
      this.status = Status.failed;
    });

    newExport.start();
  }

  private start = () => {
    console.log('STart called');
    this.conversionProcess = convertTo(
      this.format,
      {
        ...this.options,
        defaultFileName: this.video.title,
        inputPath: this.video.filePath,
        onProgress: this.onConversionProgress
      },
      this.video.encoding
    );
  }
}

export const setupConversionHook = () => {
  ipcMain.answerRenderer('create-conversion', ({
    filePath, options, format, plugins: pluginOptions
  }: {
    filePath: string;
    options: ConversionOptions,
    format: Format,
    plugins: {
      share: {
        pluginName: string;
        serviceTitle: string;
      },
      edit?: {
        pluginName: string;
        serviceTitle: string;
      }
    }
  }) => {
    console.log('HERE WITH', filePath, options, format, pluginOptions);
    const video = Video.fromId(filePath);

    if (!video) {
      return;
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

    const conversion = new Conversion(video, format, options);
    conversion.addExport({
      plugin: exportPlugin,
      service: exportService
    });

    console.log('queueed');
    return conversion.id;
  });
}
