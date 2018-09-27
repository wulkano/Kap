'use strict';

const electron = require('electron');
const got = require('got');

const {Notification} = electron;

const prettifyFormat = format => {
  const formats = new Map([
    ['apng', 'APNG'],
    ['gif', 'GIF'],
    ['mp4', 'MP4'],
    ['webm', 'WebM']
  ]);

  return formats.get(format);
};

class ShareServiceContext {
  constructor(options) {
    this.format = options.format;
    this.prettyFormat = prettifyFormat(this.format);
    this.defaultFileName = options.defaultFileName;
    this.filePath = options.convert;
    this.config = options.config;
    this.onCancel = options.onCancel;
    this.onProgress = options.onProgress;
    this.pluginName = options.pluginName;

    this.canceled = false;
    this.requests = [];

    this.request = this.request.bind(this);
    this.cancel = this.cancel.bind(this);
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.notify = this.notify.bind(this);
    this.setProgress = this.setProgress.bind(this);
    this.openConfigFile = this.openConfigFile.bind(this);
  }

  request(url, options) {
    if (this.canceled) {
      return;
    }

    const request = got(url, options);

    this.requests.push(request);

    return request;
  }

  cancel() {
    this.canceled = true;
    this.onCancel();

    for (const request of this.requests) {
      request.cancel();
    }
  }

  clear() {
    this.canceled = true;
    for (const req of this.requests) {
      req.cancel();
    }
  }

  copyToClipboard(text) {
    if (this.canceled) {
      return;
    }

    electron.clipboard.writeText(text);
  }

  notify(text) {
    if (this.canceled) {
      return;
    }

    const notification = new Notification({
      title: this.pluginName,
      body: text
    });

    notification.show();
  }

  setProgress(text, percentage) {
    if (this.canceled) {
      return;
    }

    this.onProgress(text, percentage);
  }

  openConfigFile() {
    if (this.canceled) {
      return;
    }

    this.config.openInEditor();
  }
}

module.exports = ShareServiceContext;
