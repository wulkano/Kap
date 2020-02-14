'use strict';
const {Notification, clipboard} = require('electron');
const got = require('got');
const {addPluginPromise} = require('./utils/deep-linking');

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
    this._isBuiltin = options._isBuiltin;

    this.format = options.format;
    this.prettyFormat = prettifyFormat(this.format);
    this.defaultFileName = options.defaultFileName;
    this.filePath = options.convert;
    this.config = options.config;
    this.onCancel = options.onCancel;
    this.onProgress = options.onProgress;
    this.pluginName = options.pluginName;

    this.isCanceled = false;
    this.requests = [];

    this.request = this.request.bind(this);
    this.cancel = this.cancel.bind(this);
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.notify = this.notify.bind(this);
    this.setProgress = this.setProgress.bind(this);
    this.openConfigFile = this.openConfigFile.bind(this);
  }

  request(url, options) {
    if (this.isCanceled) {
      return;
    }

    const request = got(url, options);

    this.requests.push(request);

    return request;
  }

  cancel() {
    this.isCanceled = true;
    this.onCancel();

    for (const request of this.requests) {
      request.cancel();
    }
  }

  clear() {
    this.isCanceled = true;

    for (const request of this.requests) {
      request.cancel();
    }
  }

  copyToClipboard(text) {
    if (this.isCanceled) {
      return;
    }

    clipboard.writeText(text);
  }

  notify(text) {
    if (this.isCanceled) {
      return;
    }

    let options = {
      title: this.pluginName,
      body: text
    };

    if (this._isBuiltin) {
      options = {
        body: text
      };
    }

    const notification = new Notification(options);
    notification.show();
  }

  setProgress(text, percentage) {
    if (this.isCanceled) {
      return;
    }

    this.onProgress(text, percentage);
  }

  openConfigFile() {
    if (this.isCanceled) {
      return;
    }

    this.config.openInEditor();
  }

  waitForDeepLink() {
    return new Promise(resolve => {
      addPluginPromise(this.pluginName, resolve);
    });
  }
}

module.exports = ShareServiceContext;
