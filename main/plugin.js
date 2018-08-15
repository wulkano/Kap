'use strict';

const electron = require('electron');
const path = require('path');
const Store = require('electron-store');
const saveFilePlugin = require('./save-file-service');

class Plugin {
  constructor(pluginName) {
    this.pluginName = pluginName;

    if (pluginName === 'default') {
      this.plugin = saveFilePlugin;
    } else {
      const cwd = path.join(electron.app.getPath('userData'), 'plugins');
      this.plugin = require(path.join(cwd, 'node_modules', pluginName));
    }
  }

  getSerivce(serviceTitle) {
    return this.plugin.shareServices.find(shareService => shareService.title === serviceTitle);
  }

  getConfig() {
    return new Store({
      name: this.pluginName,
      cwd: 'plugins'
    });
  }
}

module.exports = Plugin;
