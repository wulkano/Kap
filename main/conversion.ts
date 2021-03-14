import fs from 'fs';
import {app, clipboard, dialog} from 'electron';
import {EventEmitter} from 'events';
import {ConversionOptions, ConversionStatus, CreateConversionOptions, Format} from './common/types';
import {Video} from './video';
import {convertTo} from './converters';
import Export, {ExportOptions} from './export';
import hash from 'object-hash';
import {ipcMain as ipc} from 'electron-better-ipc';
import {plugins} from './plugins';
import {askForTargetFilePath} from './plugins/built-in/save-file-plugin';
import path from 'path';
import {showError} from './utils/errors';
import {notify} from './utils/notifications';
import PCancelable from 'p-cancelable';
import prettyBytes from 'pretty-bytes';
import {ensureDockIsShowingSync} from './utils/dock';
import {windowManager} from './windows/manager';

const plist = require('plist');

// TODO: remove this when exports window is rewritten
const callExportsWindow = (channel: string, data: any) => {
  const exportsWindow = windowManager.exports?.get();

  if (exportsWindow) {
    // TODO(karaggeorge): Investigate why `ipc.callRenderer(exportsWindow, channel, data);` is not working here.
    ipc.callRenderer(exportsWindow, channel, data);
  }
};

// A conversion object describes the process of converting a video or recording
// using ffmpeg that can then be shared multiple times using Share plugins
export default class Conversion extends EventEmitter {
  static conversionMap = new Map<string, Conversion>();

  static get all() {
    return [...this.conversionMap.values()];
  }

  id: string;
  video: Video;
  format: Format;
  options: ConversionOptions;

  text = '';
  percentage?: number;
  error?: Error;
  description: string;
  title: string;
  finalSize?: string;
  convertedFilePath?: string;
  requestedFileType?: Format;

  private currentExport?: Export;
  private _status: ConversionStatus = ConversionStatus.idle;

  get status() {
    return this._status;
  }

  set status(newStatus: ConversionStatus) {
    this._status = newStatus;
    this.emit('updated');
  }

  get canCopy() {
    return Boolean(this.convertedFilePath && [Format.gif, Format.apng].includes(this.format));
  }

  private conversionProcess?: PCancelable<string>;

  constructor(video: Video, format: Format, options: ConversionOptions) {
    super();
    this.video = video;
    this.format = format;
    this.options = options;

    this.description = `${this.options.width} x ${this.options.height} at ${this.options.fps} FPS`;
    this.title = video.title;

    this.id = hash({
      filePath: video.filePath,
      format,
      options
    });

    Conversion.conversionMap.set(this.id, this);

    // TODO: remove this when exports window is rewritten
    this.on('updated', () => {
      callExportsWindow('update-export-data', this.currentExport?.data);
    });
  }

  static fromId(id: string) {
    return this.conversionMap.get(id);
  }

  static getOrCreate(video: Video, format: Format, options: ConversionOptions) {
    const id = hash({
      filePath: video.filePath,
      format,
      options
    });

    return this.fromId(id) ?? new Conversion(video, format, options);
  }

  copy = () => {
    clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(plist.build([this.convertedFilePath])));
    notify({
      body: 'The file has been copied to the clipboard',
      title: app.name
    });
  };

  async filePathExists() {
    if (!this.convertedFilePath) {
      return false;
    }

    try {
      await fs.promises.access(this.convertedFilePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  onProgress = (text: string, progress: number) => {
    this.text = text;
    this.percentage = Math.max(Math.min(progress, 1), 0);

    if (this.currentExport) {
      this.currentExport.text = this.text;
      this.currentExport.percentage = this.percentage;
    }

    this.emit('updated');
  };

  filePath = async ({fileType}: {fileType?: Format} = {}) => {
    if (fileType) {
      this.currentExport?.disableActions();
    }

    if (!this.conversionProcess || (this.requestedFileType !== fileType)) {
      this.start(fileType);
    }

    this.requestedFileType = fileType;

    try {
      this.convertedFilePath = await this.conversionProcess;
      this.calculateFileSize(this.convertedFilePath);
      return this.convertedFilePath!;
    } catch (error) {
      // Ensure we re-try the conversion if it fails
      this.conversionProcess = undefined;
      throw error;
    }
  };

  addExport(exportOptions: ExportOptions) {
    this.status = ConversionStatus.inProgress;
    this.error = undefined;
    this.text = 'Initializing…';
    this.percentage = 0;

    const newExport = new Export(this, exportOptions);

    const onProgress = ({text, percentage}: {text: string; percentage: number}) => {
      newExport.status = 'processing';
      this.onExportProgress(text, percentage);
    };

    newExport.on('progress', onProgress);

    const cleanup = () => {
      this.currentExport = undefined;
      newExport.off('progress', onProgress);
    };

    newExport.once('canceled', () => {
      newExport.onProgress('Export canceled', 1);
      newExport.status = 'canceled';
      this.status = ConversionStatus.canceled;
      this.emit('updated');
      cleanup();
    });

    newExport.once('finished', () => {
      newExport.onProgress('Export completed', 1);
      newExport.status = 'completed';
      this.status = ConversionStatus.completed;
      this.emit('updated');
      cleanup();
    });

    newExport.once('error', (error: Error) => {
      showError(error, {plugin: exportOptions.plugin} as any);
      newExport.onProgress('Export failed', 1);
      newExport.status = 'failed';
      this.error = error;
      this.status = ConversionStatus.failed;
      this.emit('updated');
      cleanup();
    });

    this.currentExport = newExport;
    newExport.start();
  }

  cancel = () => {
    // Avoid infinite loop
    if (!this.conversionProcess?.isCanceled) {
      this.conversionProcess?.cancel();
    }

    this.currentExport?.onCancel();
  };

  private readonly onConversionProgress = (action: string, progress: number, estimate?: string) => {
    const text = estimate ? `${action} — ${estimate} remaining` : `${action}…`;
    this.onProgress(text, progress);
  };

  private readonly onExportProgress = (text: string, progress: number) => {
    this.onProgress(text, progress);
  };

  private readonly calculateFileSize = async (filePath?: string) => {
    if (!filePath) {
      return;
    }

    try {
      const {size} = await fs.promises.stat(filePath);
      this.finalSize = prettyBytes(size);
      this.emit('updated');
    } catch {}
  };

  private readonly start = (fileType?: Format) => {
    this.conversionProcess = convertTo(
      fileType ?? this.format,
      {
        ...this.options,
        defaultFileName: this.video.title,
        inputPath: this.video.filePath,
        onProgress: this.onConversionProgress,
        onCancel: this.cancel
      },
      this.video.encoding
    );
  };
}

export const setUpConversionListeners = () => {
  ipc.answerRenderer('create-conversion', async ({
    filePath, options, format, plugins: pluginOptions
  }: CreateConversionOptions, window) => {
    const video = Video.fromId(filePath);
    const extras: Record<string, any> = {
      appUrl: pluginOptions.share.app?.url
    };

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

    const exportPlugin = plugins.sharePlugins.find(plugin => {
      return plugin.name === pluginOptions.share.pluginName;
    });

    const exportService = exportPlugin?.shareServices.find(service => {
      return service.title === pluginOptions.share.serviceTitle;
    });

    if (!exportPlugin || !exportService) {
      return;
    }

    const conversion = Conversion.getOrCreate(video, format, options);

    if (extras.targetFilePath) {
      conversion.title = path.parse(extras.targetFilePath).name;
    }

    conversion.addExport({
      plugin: exportPlugin,
      service: exportService,
      extras
    });

    return conversion.id;
  });

  app.on('before-quit', event => {
    if (Conversion.all.some(conversion => conversion.status === ConversionStatus.inProgress)) {
      windowManager.exports?.open();

      ensureDockIsShowingSync(() => {
        const buttonIndex = dialog.showMessageBoxSync({
          type: 'question',
          buttons: [
            'Continue',
            'Quit'
          ],
          defaultId: 0,
          cancelId: 1,
          message: 'Do you want to continue exporting?',
          detail: 'Kap is currently exporting files. If you quit, the export task will be canceled.'
        });

        if (buttonIndex === 0) {
          event.preventDefault();
        }
      });
    }
  });
};
