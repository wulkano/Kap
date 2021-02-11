import path from 'path';
import getFps from './utils/fps';
import {getEncoding, convertToH264} from './utils/encoding';
import {Rectangle, screen} from 'electron';
import {Encoding} from './common/types';
import {generateTimestampedName} from './utils/timestamped-name';

interface VideoOptions {
  filePath: string;
  title?: string;
  fps?: number;
  encoding?: Encoding;
  pixelDensity?: number;
}

export class Video {
  static all = new Map<string, Video>();

  static fromId(id: string) {
    return this.all.get(id);
  }

  filePath: string;
  title: string;
  fps?: number;
  encoding?: Encoding;
  pixelDensity: number;
  previewPath?: string;

  isNewRecording = false;

  isReady = false;
  private readyPromise: Promise<void>;
  private previewReadyPromise: Promise<string | undefined>;

  constructor(options: VideoOptions) {
    this.filePath = options.filePath;
    this.title = options.title ?? path.parse(this.filePath).name;
    this.fps = options.fps;
    this.encoding = options.encoding;
    this.pixelDensity = options.pixelDensity ?? 1;

    Video.all.set(this.filePath, this);

    this.readyPromise = this.collectInfo();
    this.previewReadyPromise = this.readyPromise.then(() => this.getPreviewPath());
  }

  private async collectInfo() {
    await Promise.all([
      this.getFps(),
      this.getEncoding(),
    ]);

    this.isReady = true;
  }

  async getFps() {
    if (!this.fps) {
      this.fps = Math.round(Number.parseFloat((await getFps(this.filePath)) ?? '0'));
    }

    return this.fps;
  }

  async getEncoding() {
    if (!this.encoding) {
      this.encoding = (await getEncoding(this.filePath)) as Encoding;
    }

    return this.encoding;
  }

  async getPreviewPath() {
    if (!this.previewPath) {
      if (this.encoding === 'h264') {
        this.previewPath = this.filePath;
      } else {
        this.previewPath = await convertToH264(this.filePath);
      }
    }

    return this.encoding;
  }

  async whenReady() {
    return this.readyPromise;
  }

  async whenPreviewReady() {
    return this.previewReadyPromise;
  }
}

interface ApertureOptions {
  fps: number;
  cropArea: Rectangle;
  showCursor: boolean;
  highlightClicks: boolean;
  screenId: number;
  audioDeviceId: string;
  videoCodec: Encoding;
}

export class Recording extends Video {
  apertureOptions: ApertureOptions;

  constructor(options: VideoOptions & { apertureOptions: ApertureOptions }) {
    const displays = screen.getAllDisplays();
    const pixelDensity = displays.find(display => display.id === options.apertureOptions.screenId)?.scaleFactor;

    super({
      filePath: options.filePath,
      title: options.title || generateTimestampedName(),
      fps: options.apertureOptions.fps,
      encoding: options.apertureOptions.videoCodec,
      pixelDensity
    });

    this.apertureOptions = options.apertureOptions;
    this.isNewRecording = true;
  }
}
