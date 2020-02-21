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

class ServiceContext {
  constructor(options) {
    this._isBuiltin = options._isBuiltin;
    this.config = options.config;

    this.requests = [];
    this.isCanceled = false;

    this.request = this.request.bind(this);
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.notify = this.notify.bind(this);
    this.openConfigFile = this.openConfigFile.bind(this);
    this.waitForDeepLink = this.waitForDeepLink.bind(this);
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
    if (this.onCancel) {
      this.onCancel();
    }

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

  notify(text, action) {
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

    if (action) {
      notification.on('click', action);
    }

    notification.show();
  }

  openConfigFile() {
    if (this.isCanceled) {
      return;
    }

    this.config.openInEditor();
  }

  async waitForDeepLink() {
    return new Promise(resolve => {
      addPluginPromise(this.pluginName, resolve);
    });
  }
}

class ShareServiceContext extends ServiceContext {
  constructor(options) {
    super(options);

    this.format = options.format;
    this.prettyFormat = prettifyFormat(this.format);
    this.defaultFileName = options.defaultFileName;
    this.filePath = options.convert;
    this.onCancel = options.onCancel;
    this.onProgress = options.onProgress;
    this.pluginName = options.pluginName;

    this.isCanceled = false;

    this.cancel = this.cancel.bind(this);
    this.setProgress = this.setProgress.bind(this);
  }

  clear() {
    this.isCanceled = true;

    for (const request of this.requests) {
      request.cancel();
    }
  }

  setProgress(text, percentage) {
    if (this.isCanceled) {
      return;
    }

    this.onProgress(text, percentage);
  }
}

class RecordServiceContext extends ServiceContext {
  constructor(options) {
    super(options);

    this.apertureOptions = options.apertureOptions;
    this.state = options.state;
  }
}

class EditServiceContext extends ServiceContext {
  constructor(options) {
    super(options);

    this.exportOptions = options.exportOptions;
    this.convert = options.convert;
  }
}

module.exports = {
  ShareServiceContext,
  RecordServiceContext,
  EditServiceContext
};
