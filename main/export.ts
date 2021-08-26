import {ipcMain, dialog, app} from 'electron';
import {EventEmitter} from 'events';
import PCancelable, {CancelError, OnCancelFunction} from 'p-cancelable';
import Conversion from './conversion';
import {InstalledPlugin} from './plugins/plugin';
import {ShareService} from './plugins/service';
import {ShareServiceContext} from './plugins/service-context';
import {prettifyFormat} from './utils/formats';
import {ipcMain as ipc} from 'electron-better-ipc';
import {setExportMenuItemState} from './menus/utils';
import {Video} from './video';
import {ConversionOptions, ExportState, ExportStatus, Format, CreateExportOptions} from './common/types';
import {showError} from './utils/errors';
import TypedEventEmitter from 'typed-emitter';
import {plugins} from './plugins';
import {askForTargetFilePath} from './plugins/built-in/save-file-plugin';
import path from 'path';
import {ensureDockIsShowingSync} from './utils/dock';
import {windowManager} from './windows/manager';

export interface ExportOptions {
  plugin: InstalledPlugin;
  service: ShareService;
  extras: Record<string, unknown>;
}

export default class Export extends (EventEmitter as new () => TypedEventEmitter<ExportEvents>) {
  static exportsMap = new Map<string, Export>();
  static events = new EventEmitter() as TypedEventEmitter<ExportsEvents>;

  static get all() {
    return [...this.exportsMap.values()];
  }

  readonly createdAt: number = Date.now();
  conversion?: Conversion;
  status: ExportStatus = ExportStatus.inProgress;

  private text = 'Loading…';
  private percentage = 0;

  private readonly context: ShareServiceContext;
  private process?: PCancelable<void>;
  private areOutputActionsDisabled = false;
  private error?: Error;
  private readonly description: string;

  private readonly _start = PCancelable.fn(async (onCancel: OnCancelFunction) => {
    this.error = undefined;
    this.text = 'Loading…';
    const action = this.options.service.action(this.context) as any;

    onCancel(() => {
      if (action.cancel && typeof action.cancel === 'function') {
        action.cancel();
      }

      this.context.isCanceled = true;
    });

    try {
      await action;
      this.status = ExportStatus.completed;
      this.text = 'Export completed';
      this.emit('updated', this.data);
    } catch (error) {
      this.captureError(error);
    }
  });

  constructor(
    public readonly video: Video,
    private readonly format: Format,
    private readonly conversionOptions: ConversionOptions,
    private readonly options: ExportOptions,
    private readonly title: string = video.title
  ) {
    // eslint-disable-next-line constructor-super
    super();
    Export.addExport(this);
    video.generatePreviewImage();

    this.description = `${this.conversionOptions.width} x ${this.conversionOptions.height} at ${this.conversionOptions.fps} FPS`;

    this.context = new ShareServiceContext({
      plugin: options.plugin,
      format,
      prettyFormat: prettifyFormat(format),
      defaultFileName: video.title,
      filePath: this.filePath,
      onProgress: this.onProgress,
      onCancel: this.cancel
    });

    // Used for built-in plugins like save-to-disk
    for (const [key, value] of Object.entries(options.extras)) {
      (this.context as any)[key] = value;
    }

    setExportMenuItemState(true);
  }

  static addExport = (newExport: Export) => {
    Export.exportsMap.set(newExport.id, newExport);
    Export.events.emit('added', newExport.data);

    newExport.on('updated', state => Export.events.emit('updated', state));
  };

  static fromId(id: string) {
    return this.exportsMap.get(id);
  }

  get id() {
    return this.createdAt.toString();
  }

  get canPreviewExport() {
    return [Format.gif, Format.apng].includes(this.format) && this.finalFilePath !== undefined;
  }

  get finalFilePath() {
    const filePath = this.conversion?.convertedFilePath;

    // If Save To Disk plugin is used, open the file in the final destination, not the temp one
    return filePath && ((this.options.extras.targetFilePath as string) ?? filePath);
  }

  get data(): ExportState {
    return {
      title: this.title,
      titleWithFormat: `${this.title}.${this.format}`,
      description: this.description,
      canCopy: this.conversion?.canCopy ?? false,
      status: this.status,
      message: this.text,
      progress: this.percentage ?? 0,
      image: this.video.previewImage?.data,
      id: this.id,
      filePath: this.conversion?.convertedFilePath,
      error: this.error,
      fileSize: this.conversion?.finalSize,
      disableOutputActions: this.areOutputActionsDisabled,
      canPreviewExport: this.canPreviewExport
    };
  }

  filePath = async ({fileType}: {fileType?: Format} = {}) => {
    if (fileType) {
      this.areOutputActionsDisabled = true;
    }

    const format = fileType ?? this.format;

    this.conversion = Conversion.getOrCreate(this.video, format, this.conversionOptions);
    this.setupConversionListeners();

    return this.conversion.filePath();
  };

  start = async () => {
    try {
      this.process = this._start();
      await this.process;
    } catch (error) {
      this.captureError(error);
    }
  };

  onProgress = (text: string, percentage: number) => {
    if (this.status !== ExportStatus.inProgress) {
      return;
    }

    this.text = text;
    this.percentage = percentage;
    this.emit('updated', this.data);
  };

  cancel = () => {
    this.process?.cancel();
    this.conversion?.cancel();
    this.status = ExportStatus.canceled;
    this.text = 'Export canceled';
    this.context.isCanceled = true;
    this.emit('updated', this.data);
  };

  retry = () => {
    this.status = ExportStatus.inProgress;
    this.error = undefined;
    this.text = '';
    this.start();
    this.emit('updated', this.data);
  };

  private readonly captureError = (error: Error, fromConversion = false) => {
    if ((error as CancelError).isCanceled) {
      this.text = 'Export canceled';
      this.status = ExportStatus.canceled;
    } else {
      this.text = 'Export failed';
      this.status = ExportStatus.failed;

      if (!this.error) {
        this.error = error;
        showError(error, fromConversion ? undefined : {plugin: this.options.plugin});
      }
    }

    this.emit('updated', this.data);
  };

  private readonly captureConversionError = (error: Error) => this.captureError(error, true);

  private readonly setupConversionListeners = () => {
    this.conversion?.once('file-size', () => this.emit('updated', this.data));

    this.conversion?.on('cancel', this.cancel);
    this.conversion?.on('progress', this.onProgress);
    this.conversion?.on('error', this.captureConversionError);
    this.conversion?.on('completed', this.cleanConversionListeners);
  };

  private readonly cleanConversionListeners = () => {
    this.conversion?.removeListener('cancel', this.cancel);
    this.conversion?.removeListener('progress', this.onProgress);
    this.conversion?.removeListener('error', this.captureConversionError);
  };
}

interface ExportEvents {
  updated: (state: ExportState) => void;
}

interface ExportsEvents {
  added: (state: ExportState) => void;
  updated: (state: ExportState) => void;
}

export const setUpExportsListeners = () => {
  ipcMain.on('drag-export', async (event: any, id: string) => {
    const conversion = Export.exportsMap.get(id)?.conversion;

    if (conversion && (await conversion.filePathExists())) {
      event.sender.startDrag({
        file: conversion.convertedFilePath,
        icon: await conversion.video.getDragIcon(conversion.options)
      });
    }
  });

  ipc.answerRenderer('create-export', async ({
    filePath, conversionOptions, format, plugins: pluginOptions
  }: CreateExportOptions, window) => {
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

    const newExport = new Export(
      video,
      format,
      conversionOptions,
      {
        plugin: exportPlugin,
        service: exportService,
        extras
      },
      extras.targetFilePath && path.parse(extras.targetFilePath).name
    );

    newExport.start();

    return newExport.id;
  });

  app.on('before-quit', event => {
    if (Export.all.some(exp => exp.status === ExportStatus.inProgress)) {
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
