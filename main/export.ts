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
}

export default class Export extends EventEmitter {
  conversion: Conversion;
  options: ExportOptions;
  context: ShareServiceContext;

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
  }

  start = PCancelable.fn(async (onCancel: OnCancelFunction) => {
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
      this.emit('error', error);
    }
  });

  onProgress = (text: string, percentage: number) => {
    this.emit('progress', {text, percentage});
  }

  onCancel = () => {
    this.emit('canceled');
  }
}
