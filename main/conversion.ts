import fs from 'fs';
import {app, clipboard} from 'electron';
import {EventEmitter} from 'events';
import {ConversionOptions, Format} from './common/types';
import {Video} from './video';
import {convertTo} from './converters';
import hash from 'object-hash';
import {notify} from './utils/notifications';
import PCancelable from 'p-cancelable';
import prettyBytes from 'pretty-bytes';
import TypedEventEmitter from 'typed-emitter';

const plist = require('plist');

// A conversion object describes the process of converting a video or recording
// using ffmpeg that can then be shared multiple times using Share plugins
export default class Conversion extends (EventEmitter as new () => TypedEventEmitter<ConversionEvents>) {
  static conversionMap = new Map<string, Conversion>();

  static get all() {
    return [...this.conversionMap.values()];
  }

  readonly id: string;
  finalSize?: string;
  convertedFilePath?: string;

  get canCopy() {
    return Boolean(this.convertedFilePath && [Format.gif, Format.apng, Format.mp4].includes(this.format));
  }

  private conversionProcess?: PCancelable<string>;

  constructor(
    public readonly video: Video,
    public readonly format: Format,
    public readonly options: ConversionOptions
  ) {
    // eslint-disable-next-line constructor-super
    super();

    this.id = hash({
      filePath: video.filePath,
      format,
      options
    });

    Conversion.conversionMap.set(this.id, this);
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

  filePath = async () => {
    if (!this.conversionProcess) {
      this.start();
    }

    try {
      this.convertedFilePath = await this.conversionProcess;
      this.emit('completed');
      this.calculateFileSize(this.convertedFilePath);
      return this.convertedFilePath!;
    } catch (error) {
      // Ensure we re-try the conversion if it fails
      this.conversionProcess = undefined;
      if (!error.isCanceled) {
        this.emit('error', error);
      }

      throw error;
    }
  };

  cancel = () => {
    if (!this.conversionProcess?.isCanceled && !this.convertedFilePath) {
      this.conversionProcess?.cancel();
    }
  };

  private readonly onConversionProgress = (action: string, progress: number, estimate?: string) => {
    const text = estimate ? `${action} — ${estimate} remaining` : `${action}…`;
    this.emit('progress', text, Math.max(Math.min(progress, 1), 0));
  };

  private readonly calculateFileSize = async (filePath?: string) => {
    if (!filePath) {
      return;
    }

    try {
      const {size} = await fs.promises.stat(filePath);
      this.finalSize = prettyBytes(size);
      this.emit('file-size', this.finalSize);
    } catch {}
  };

  private readonly start = () => {
    this.conversionProcess = convertTo(
      this.format,
      {
        ...this.options,
        defaultFileName: this.video.title,
        inputPath: this.video.filePath,
        onProgress: this.onConversionProgress,
        onCancel: () => {
          this.emit('cancel');
        }
      },
      this.video.encoding
    );
  };
}

interface ConversionEvents {
  progress: (text: string, percentage: number) => void;
  error: (error: Error) => void;
  cancel: () => void;
  completed: () => void;
  'file-size': (size: string) => void;
}
