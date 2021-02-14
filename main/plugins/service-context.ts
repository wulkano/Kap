import {app, clipboard} from 'electron';
import Store from 'electron-store';
import got, {GotFn, GotPromise} from 'got';
import {ApertureOptions, Format} from '../common/types';
import {InstalledPlugin} from './plugin';
import {addPluginPromise} from '../utils/deep-linking';
import {notify} from '../utils/notifications';
import PCancelable from 'p-cancelable';
import {getFormatExtension} from '../common/constants';

interface ServiceContextOptions {
  plugin: InstalledPlugin;
}

class ServiceContext {
  requests: Array<GotPromise<any>> = [];
  config: Store;

  private readonly plugin: InstalledPlugin;

  constructor(options: ServiceContextOptions) {
    this.plugin = options.plugin;
    this.config = this.plugin.config;
  }

  request = (...args: Parameters<GotFn>) => {
    const request = got(...args);
    this.requests.push(request);
    return request;
  };

  copyToClipboard = (text: string) => {
    clipboard.writeText(text);
  };

  notify = (text: string, action?: () => any) => {
    return notify({
      body: text,
      title: this.plugin.isBuiltIn ? app.name : this.plugin.prettyName,
      click: action
    });
  };

  openConfigFile = () => {
    this.config.openInEditor();
  };

  waitForDeepLink = async () => {
    return new Promise(resolve => {
      addPluginPromise(this.plugin.name, resolve);
    });
  };
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
  isCanceled = false;

  private readonly options: ShareServiceContextOptions;

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

  filePath = async (options?: {fileType?: Format}) => {
    return this.options.filePath(options);
  };

  setProgress = (text: string, percentage: number) => {
    this.options.onProgress(text, percentage);
  };

  cancel = () => {
    this.isCanceled = true;
    this.options.onCancel();

    for (const request of this.requests) {
      request.cancel();
    }
  };
}

interface EditServiceContextOptions extends ServiceContextOptions {
  onProgress: (text: string, percentage: number) => void;
  inputPath: string;
  outputPath: string;
  exportOptions: {
    width: number;
    height: number;
    format: Format;
    fps: number;
    duration: number;
    isMuted: boolean;
    loop: boolean;
  };
  convert: (args: string[], text?: string) => PCancelable<void>;
  onCancel: () => void;
}

export class EditServiceContext extends ServiceContext {
  isCanceled = false;

  private readonly options: EditServiceContextOptions;

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
  };

  cancel = () => {
    this.isCanceled = true;
    this.options.onCancel();

    for (const request of this.requests) {
      request.cancel();
    }
  };
}

export type RecordServiceState<PersistedState extends Record<string, unknown> = Record<string, unknown>> = {
  persistedState?: PersistedState;
};

export interface RecordServiceContextOptions<State extends RecordServiceState> extends ServiceContextOptions {
  apertureOptions: ApertureOptions;
  state: State;
  setRecordingName: (name: string) => void;
}

export class RecordServiceContext<State extends RecordServiceState> extends ServiceContext {
  private readonly options: RecordServiceContextOptions<State>;

  constructor(options: RecordServiceContextOptions<State>) {
    super(options);
    this.options = options;
  }

  get state() {
    return this.options.state;
  }

  get apertureOptions() {
    return this.options.apertureOptions;
  }

  get setRecordingName() {
    return this.options.setRecordingName;
  }
}
