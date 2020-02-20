'use strict';

const path = require('path');
const fs = require('fs');
const electron = require('electron');
const {satisfies} = require('semver');
const Store = require('electron-store');

const PluginConfig = require('./utils/plugin-config');
const {showError} = require('./utils/errors');

const {app, shell} = electron;

const recordPluginServiceState = new Store({
  name: 'record-plugin-state',
  defaults: {}
});

class BasePlugin {
  constructor(pluginName) {
    this.name = pluginName;
  }

  get prettyName() {
    return this.name.replace(/^kap-/, '');
  }
}

class InstalledPlugin extends BasePlugin {
  constructor(pluginName) {
    super(pluginName);

    this.isInstalled = true;
    this.cwd = path.join(app.getPath('userData'), 'plugins');
    this.pkgPath = path.join(this.cwd, 'package.json');
    this.isSymlink = fs.lstatSync(this.pluginPath).isSymbolicLink();

    this.json = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));

    const {homepage, links} = this.json;
    this.link = homepage || (links && links.homepage);
    this.isCompatible = satisfies(app.getVersion(), this.json.kapVersion || '*');

    try {
      this.plugin = require(this.pluginPath);
    } catch (error) {
      showError(error, {title: `Something went wrong while loading “${pluginName}”`});
      this.plugin = {};
    }

    this.config = new PluginConfig(this);
  }

  getPath(subPath = '') {
    return path.join(this.cwd, 'node_modules', this.name, subPath);
  }

  get version() {
    return this.json.version;
  }

  get description() {
    return this.json.description;
  }

  get pluginPath() {
    return this.getPath();
  }

  get packageJsonPath() {
    return this.getPath('package.json');
  }

  get isValid() {
    return this.config.isConfigValid();
  }

  get hasConfig() {
    return this.allServices.some(({config = {}}) => Object.keys(config).length > 0);
  }

  get recordServices() {
    return this.plugin.recordServices || [];
  }

  get recordServicesWithStatus() {
    return this.recordServices.map(service => ({
      ...service,
      isEnabled: recordPluginServiceState.get(service.title) || false
    }));
  }

  get shareServices() {
    return this.plugin.shareServices || [];
  }

  get allServices() {
    return [
      ...this.recordServices,
      ...this.shareServices
    ];
  }

  openConfig() {
    this.config.openInEditor();
  }

  viewOnGithub() {
    shell.openExternal(this.link);
  }
}

class NpmPlugin extends BasePlugin {
  constructor(json, kapVersion) {
    super(json.name);

    this.kapVersion = kapVersion;
    this.isInstalled = false;

    this.version = json.version;
    this.description = json.description;

    const {homepage, links} = json;
    this.link = homepage || (links && links.homepage);

    this.isCompatible = satisfies(app.getVersion(), kapVersion || '*');
  }

  viewOnGithub() {
    shell.openExternal(this.link);
  }
}

module.exports = {
  InstalledPlugin,
  NpmPlugin,
  recordPluginServiceState
};
