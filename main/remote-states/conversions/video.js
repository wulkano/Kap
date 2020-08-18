const path = require('path');
const getFps = require('../../utils/fps');
const {getEncoding, convertToH264} = require('../../utils/encoding');

class Video {
  constructor(options) {
    this.filePath = options.filePath;
    this.title = options.title || path.basename(this.filePath);
    this.fps = options.fps;
    this.encoding = options.encoding;
    this.pixelDensity = options.pixelDensity || 1;

    this.whenReady = this._collectInfo();
  }

  async _collectInfo() {
    return Promise.all([
      this.getFps(),
      this.getEncoding(),
      this.getPreviewPath()
    ]);
  }

  async getFps() {
    if (!this.fps) {
      this.fps = await getFps(this.filePath);
    }

    return this.fps;
  }

  async getEncoding() {
    if (!this.encoding) {
      this.encoding = getEncoding(this.filePath);
    }
  }

  async getPreviewPath() {
    if (!this.previewPath) {
      const encoding = await this.getEncoding();

      if (encoding === 'h264') {
        this.previewPath = this.filePath;
      } else {
        this.previewPath = await convertToH264(this.filePath)
      }
    }

    return this.previewPath;
  }
}

class Recording extends Video {
  constructor(options) {
    super({
      ...options,
      fps: options.recordingOptions.fps,
      encoding: options.recordingOptions.encoding,
      pixelDensity: options.recordingOptions.pixelDensity,
      title: options.recordingName
    });

    this.recordingOptions = options.recordingOptions;
  }
}

module.exports = {
  Video,
  Recording
};
