import {app, clipboard} from 'electron';
import Store from 'electron-store';
import got, {GotFn, GotPromise} from 'got';
import {Format} from '../common/types';
import {InstalledPlugin} from './plugin';
import {addPluginPromise} from '../utils/deep-linking';
import {notify} from '../utils/notifications';
import PCancelable from 'p-cancelable';
import {getFormatExtension} from '../common/constants';

interface ServiceContextOptions {
  plugin: InstalledPlugin;
}

class ServiceContext {
  private plugin: InstalledPlugin;
  requests: GotPromise<any>[] = [];

  config: Store;

  constructor(options: ServiceContextOptions) {
    this.plugin = options.plugin;
    this.config = this.plugin.config;
  }

  request = (...args: Parameters<GotFn>) => {
    const request = got(...args);
    this.requests.push(request);
    return request;
  }

  copyToClipboard = (text: string) => {
    clipboard.writeText(text);
  }

  notify = (text: string, action?: () => any) => {
    return notify({
      body: text,
      title: this.plugin.isBuiltIn ? app.name : this.plugin.prettyName,
      click: action
    });
  }

  openConfigFile = () => {
    this.config.openInEditor();
  }

  waitForDeepLink = async () => {
    return new Promise(resolve => {
      addPluginPromise(this.plugin.name, resolve);
    });
  }
}

interface ShareServiceContextOptions extends ServiceContextOptions {
  onProgress: (text: string, percentage: number) => void;
  filePath: (options?: {fileType?: Format}) => Promise<string>;
  format: Format;
  prettyFormat: string;
  defaultFileName: string;
  onCancel: () => void;
}

export class ShareServiceContext extends ServiceContext {
  private options: ShareServiceContextOptions;

  isCanceled = false;

  constructor(options: ShareServiceContextOptions) {
    super(options);
    this.options = options;
  }

  get format() {
    return this.options.format;
  }

  get prettyFormat() {
    return this.options.prettyFormat;
  }

  get defaultFileName() {
    return `${this.options.defaultFileName}.${getFormatExtension(this.options.format)}`;
  }

  filePath = (options: {fileType?: Format}) => {
    return this.options.filePath(options);
  }

  setProgress = (text: string, percentage: number) => {
    this.options.onProgress(text, percentage);
  }

  cancel = () => {
    this.isCanceled = true;
    this.options.onCancel();

    for (const request of this.requests) {
      request.cancel();
    }
  }
}

interface EditServiceContextOptions extends ServiceContextOptions {
  onProgress: (text: string, percentage: number) => void;
  inputPath: string,
  outputPath: string,
  exportOptions: {
    width: number,
    height: number,
    format: Format,
    fps: number,
    duration: number,
    isMuted: boolean,
    loop: boolean
  },
  convert: (args: string[], text?: string) => PCancelable<void>,
  onCancel: () => void;
}

export class EditServiceContext extends ServiceContext {
  private options: EditServiceContextOptions;

  isCanceled = false;

  constructor(options: EditServiceContextOptions) {
    super(options);
    this.options = options;
  }

  get inputPath() {
    return this.options.inputPath;
  }

  get outputPath() {
    return this.options.outputPath;
  }

  get exportOptions() {
    return this.options.exportOptions;
  }

  get convert() {
    return this.options.convert;
  }

  setProgress = (text: string, percentage: number) => {
    this.options.onProgress(text, percentage);
  }

  cancel = () => {
    this.isCanceled = true;
    this.options.onCancel();

    for (const request of this.requests) {
      request.cancel();
    }
  }
}
