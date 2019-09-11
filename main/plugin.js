'use strict';

const electron = require('electron');
const path = require('path');
const fs = require('fs');
const PluginConfig = require('./utils/plugin-config');

const {app, shell} = electron;

class Plugin {
  constructor(pluginName) {
    this.pluginName = pluginName;

    const cwd = path.join(app.getPath('userData'), 'plugins');
    const pluginPath = path.join(cwd, 'node_modules', pluginName);
    this.plugin = require(pluginPath);
    const {homepage, links} = JSON.parse(fs.readFileSync(path.join(pluginPath, 'package.json'), 'utf8'));
    this.link = homepage || (links && links.homepage);

    this.config = new PluginConfig(pluginName, this.plugin);
  }

  isConfigValid() {
    return this.config.isConfigValid();
  }

  getSerivce(serviceTitle) {
    return this.plugin.shareServices.find(shareService => shareService.title === serviceTitle);
  }

  openConfig() {
    this.config.openInEditor();
  }

  viewOnGithub() {
    shell.openExternal(this.link);
  }
}

module.exports = Plugin;
