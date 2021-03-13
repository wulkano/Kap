import path from 'path';
import getFps from './utils/fps';
import {getEncoding, convertToH264} from './utils/encoding';
import {nativeImage, NativeImage, screen} from 'electron';
import {ApertureOptions, Encoding} from './common/types';
import {generateTimestampedName} from './utils/timestamped-name';
import fs from 'fs';
import {generatePreviewImage} from './utils/image-preview';
import {windowManager} from './windows/manager';

interface VideoOptions {
  filePath: string;
  title?: string;
  fps?: number;
  encoding?: Encoding;
  previewPath?: string;
  pixelDensity?: number;
  isNewRecording?: boolean;
}

export class Video {
  static all = new Map<string, Video>();

  filePath: string;
  title: string;
  fps?: number;
  encoding?: Encoding;
  pixelDensity: number;
  previewPath?: string;
  dragIcon?: NativeImage;
  isNewRecording = false;
  isReady = false;
  previewImage?: {path: string; data: string};

  private readonly readyPromise: Promise<void>;
  private readonly previewReadyPromise: Promise<string | undefined>;

  constructor(options: VideoOptions) {
    this.filePath = options.filePath;
    this.title = options.title ?? path.parse(this.filePath).name;
    this.fps = options.fps;
    this.encoding = options.encoding;
    this.pixelDensity = options.pixelDensity ?? 1;
    this.isNewRecording = options.isNewRecording ?? false;
    this.previewPath = options.previewPath;

    Video.all.set(this.filePath, this);

    this.readyPromise = this.collectInfo();
    this.previewReadyPromise = this.readyPromise.then(async () => this.getPreviewPath());
  }

  static fromId(id: string) {
    return this.all.get(id);
  }

  static getOrCreate(options: VideoOptions) {
    return Video.fromId(options.filePath) ?? new Video(options);
  }

  async getFps() {
    if (!this.fps) {
      this.fps = Math.round(Number.parseFloat((await getFps(this.filePath)) ?? '0'));
    }

    return this.fps;
  }

  async exists() {
    try {
      await fs.promises.access(this.filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getEncoding() {
    if (!this.encoding) {
      this.encoding = (await getEncoding(this.filePath)) as Encoding;
    }

    return this.encoding;
  }

  async getPreviewPath() {
    if (!await this.exists()) {
      return;
    }

    if (!this.previewPath) {
      if (this.encoding === 'h264') {
        this.previewPath = this.filePath;
      } else {
        this.previewPath = await convertToH264(this.filePath);
      }
    }

    return this.previewPath;
  }

  async getDragIcon({width, height}: {width: number; height: number}) {
    const previewImagePath = (await this.generatePreviewImage())?.path;

    if (previewImagePath) {
      const resizeOptions = width > height ? {width: 64} : {height: 64};
      return nativeImage.createFromPath(previewImagePath).resize(resizeOptions);
    }

    return nativeImage.createEmpty();
  }

  async generatePreviewImage() {
    if (!this.previewImage) {
      this.previewImage = await generatePreviewImage(this.filePath);
    }

    return this.previewImage;
  }

  async whenReady() {
    return this.readyPromise;
  }

  async whenPreviewReady() {
    return this.previewReadyPromise;
  }

  async openEditorWindow() {
    return windowManager.editor?.open(this);
  }

  private async collectInfo() {
    if (!await this.exists()) {
      return;
    }

    await Promise.all([
      this.getFps(),
      this.getEncoding()
    ]);

    this.isReady = true;
  }
}

export class Recording extends Video {
  apertureOptions: ApertureOptions;

  constructor(options: VideoOptions & { apertureOptions: ApertureOptions }) {
    const displays = screen.getAllDisplays();
    const pixelDensity = displays.find(display => display.id === options.apertureOptions.screenId)?.scaleFactor;

    super({
      filePath: options.filePath,
      title: options.title ?? generateTimestampedName(),
      fps: options.apertureOptions.fps,
      encoding: options.apertureOptions.videoCodec ?? Encoding.h264,
      pixelDensity
    });

    this.apertureOptions = options.apertureOptions;
    this.isNewRecording = true;
  }
}
