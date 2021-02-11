import {EventEmitter} from 'events';
import PCancelable, {OnCancelFunction} from 'p-cancelable';
import Conversion from './conversion';
import {InstalledPlugin} from './plugins/plugin';
import {ShareService} from './plugins/service';
import {ShareServiceContext} from './plugins/service-context';
import {prettifyFormat} from './utils/formats';

export interface ExportOptions {
  plugin: InstalledPlugin;
  service: ShareService;
  extras: object;
}

export default class Export extends EventEmitter {
  conversion: Conversion;
  options: ExportOptions;
  context: ShareServiceContext;

  private process?: PCancelable<void>

  constructor(conversion: Conversion, options: ExportOptions) {
    super();
    this.conversion = conversion;
    this.options = options;

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
  }

  start = () => {
    this.process = this._start();
    return this.process;
  }

  private _start = PCancelable.fn(async (onCancel: OnCancelFunction) => {
    const action = this.options.service.action(this.context) as any;

    onCancel(() => {
      if (action.cancel && typeof action.cancel === 'function') {
        action.cancel();
      }
      this.context.isCanceled = true;
    });

    try {
      console.log('In here plz');
      await action;
      console.log('Donezo!');
      this.emit('finished');
    } catch (error) {
      console.error('GOT ERROR PLZ', error);
      if (!error.isCanceled) {
        this.emit('error', error);
      }
    }
  });

  onProgress = (text: string, percentage: number) => {
    console.log('Prgressing!');
    this.emit('progress', {text, percentage});
  }

  onCancel = () => {
    this.process?.cancel();
    this.emit('canceled');
  }
}
