import {ipcMain} from 'electron';
import {EventEmitter} from 'events';
import PCancelable, {OnCancelFunction} from 'p-cancelable';
import Conversion from './conversion';
import {InstalledPlugin} from './plugins/plugin';
import {ShareService} from './plugins/service';
import {ShareServiceContext} from './plugins/service-context';
import {prettifyFormat} from './utils/formats';
import {ipcMain as ipc} from 'electron-better-ipc';
import {setExportMenuItemState} from './menus/utils';

export interface ExportOptions {
  plugin: InstalledPlugin;
  service: ShareService;
  extras: Record<string, unknown>;
}

export default class Export extends EventEmitter {
  static exportsMap = new Map<number, Export>();

  static get all() {
    return [...this.exportsMap.values()];
  }

  conversion: Conversion;
  options: ExportOptions;
  context: ShareServiceContext;
  createdAt: number = Date.now();
  status = 'waiting';
  text = '';
  percentage = 0;

  private process?: PCancelable<void>;

  private disableOutputActions = false;

  private readonly _start = PCancelable.fn(async (onCancel: OnCancelFunction) => {
    const action = this.options.service.action(this.context) as any;

    onCancel(() => {
      if (action.cancel && typeof action.cancel === 'function') {
        action.cancel();
      }

      this.context.isCanceled = true;
    });

    try {
      await action;
      this.emit('finished');
    } catch (error) {
      if (!error.isCanceled) {
        this.emit('error', error);
      }
    }
  });

  constructor(conversion: Conversion, options: ExportOptions) {
    super();
    this.conversion = conversion;
    this.options = options;

    this.conversion.video.generatePreviewImage();

    this.context = new ShareServiceContext({
      plugin: options.plugin,
      format: conversion.format,
      prettyFormat: prettifyFormat(conversion.format),
      defaultFileName: conversion.video.title,
      filePath: conversion.filePath,
      onProgress: this.onProgress,
      onCancel: this.onCancel
    });

    // Used for built-in plugins like save-to-disk
    for (const [key, value] of Object.entries(options.extras)) {
      (this.context as any)[key] = value;
    }

    Export.addExport(this);
    setExportMenuItemState(true);
  }

  static addExport = (newExport: Export) => {
    Export.exportsMap.set(newExport.createdAt, newExport);
  };

  get data() {
    return {
      defaultFileName: this.conversion.title,
      status: this.status,
      text: this.text,
      percentage: this.percentage ?? 0,
      image: this.conversion.video.previewImage?.data,
      createdAt: this.createdAt,
      filePath: this.conversion.convertedFilePath,
      error: this.conversion.error,
      disableOutputActions: this.disableOutputActions
    };
  }

  disableActions = () => {
    this.disableOutputActions = true;
  };

  start = async () => {
    try {
      this.process = this._start();
      await this.process;
    } catch (error) {
      if (!error.isCanceled) {
        this.emit('error', error);
      }
    }
  };

  onProgress = (text: string, percentage: number) => {
    this.emit('progress', {text, percentage});
  };

  onCancel = () => {
    this.process?.cancel();
    this.emit('canceled');
  };
}

export const setUpExportsListeners = () => {
  ipc.answerRenderer('get-exports', () => Export.all.map(exp => exp.data));
  ipc.answerRenderer('cancel-export', (createdAt: number) => {
    Export.exportsMap.get(createdAt)?.onCancel();
  });

  ipc.answerRenderer('open-export', (createdAt: number) => {
    Export.exportsMap.get(createdAt)?.conversion?.video?.openEditorWindow?.();
  });

  ipcMain.on('drag-export', async (event: any, createdAt: number) => {
    const conversion = Export.exportsMap.get(createdAt)?.conversion;

    if (conversion && (await conversion.filePathExists())) {
      event.sender.startDrag({
        file: conversion.convertedFilePath,
        icon: await conversion.video.getDragIcon(conversion.options)
      });
    }
  });

  ipcMain.on('drag-conversion', async (event: any, id: string) => {
    const conversion = Conversion.fromId(id);

    if (conversion && (await conversion.filePathExists())) {
      event.sender.startDrag({
        file: conversion.convertedFilePath,
        icon: await conversion.video.getDragIcon(conversion.options)
      });
    }
  });
};
