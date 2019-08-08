const path = require('path');
const fs = require('fs');
const electron = require('electron');
const got = require('got');
const execa = require('execa');
const makeDir = require('make-dir');
const {ipcMain: ipc} = require('electron-better-ipc');
const packageJson = require('package-json');
const {satisfies} = require('semver');

const {app, Notification} = electron;

const Plugin = require('../plugin');
const {openConfigWindow} = require('../config');
const {openPrefsWindow} = require('../preferences');
const {notify} = require('./notifications');
const {track} = require('./analytics');

class Plugins {
  constructor() {
    this.npmBin = path.join(__dirname, '../../node_modules/npm/bin/npm-cli.js');
    this._makePluginsDir();
    this.appVersion = app.getVersion();
  }

  setUpdateExportOptions(updateExportOptions) {
    this.updateExportOptions = updateExportOptions;
  }

  _makePluginsDir() {
    const cwd = path.join(app.getPath('userData'), 'plugins');
    const fp = path.join(cwd, 'package.json');

    if (!fs.existsSync(fp)) {
      makeDir.sync(cwd);
      fs.writeFileSync(fp, '{"dependencies":{}}');
    }

    this.cwd = cwd;
    this.pkgPath = fp;
  }

  _modifyMainPackageJson(modifier) {
    const pkg = JSON.parse(fs.readFileSync(this.pkgPath, 'utf8'));
    modifier(pkg);
    fs.writeFileSync(this.pkgPath, JSON.stringify(pkg));
  }

  async _runNpm(...commands) {
    await execa(process.execPath, [this.npmBin, ...commands], {
      cwd: this.cwd,
      env: {
        ELECTRON_RUN_AS_NODE: 1
      }
    });
  }

  _getPrettyName(name) {
    return name.replace(/^kap-/, '');
  }

  _pluginPath(name, subPath = '') {
    return path.join(this.cwd, 'node_modules', name, subPath);
  }

  _pluginNames() {
    const pkg = fs.readFileSync(path.join(this.cwd, 'package.json'), 'utf8');
    return Object.keys(JSON.parse(pkg).dependencies);
  }

  async _npmInstall() {
    await this._runNpm('install', '--no-package-lock', '--registry', 'https://registry.npmjs.org');
  }

  async install(name) {
    const prettyName = this._getPrettyName(name);
    track(`plugin/installed/${name}`);
    // We manually add it to the package.json here so we're able to set the version to `latest`
    this._modifyMainPackageJson(pkg => {
      pkg.dependencies[name] = 'latest';
    });

    try {
      await this._npmInstall();

      const plugin = new Plugin(name);
      const isValid = plugin.isConfigValid();
      const hasConfig = this.getServices(name).some(({config = {}}) => Object.keys(config).length > 0);

      const options = isValid ? {
        title: 'Plugin installed',
        body: `"${prettyName}" is ready for use`
      } : {
        title: 'Configure plugin',
        body: `"${prettyName}" requires configuration`,
        actions: [{type: 'button', text: 'Configure'}]
      };

      const notification = new Notification(options);

      if (!isValid) {
        const openConfig = async () => {
          const prefsWindow = await openPrefsWindow();
          ipc.callRenderer(prefsWindow, 'open-plugin-config', name);
        };

        notification.on('click', openConfig);

        notification.on('action', (_, index) => {
          if (index === 0) {
            openConfig();
          } else {
            notification.close();
          }
        });
      }

      notification.show();
      this.updateExportOptions();

      return {hasConfig, isValid};
    } catch (error) {
      notify(`Something went wrong while installing ${prettyName}`);
      this._modifyMainPackageJson(pkg => {
        delete pkg.dependencies[name];
      });
      console.log(error);
    }
  }

  async upgrade() {
    await this._npmInstall();
  }

  uninstall(name) {
    track(`plugin/uninstalled/${name}`);
    this._modifyMainPackageJson(pkg => {
      delete pkg.dependencies[name];
    });
    const plugin = new Plugin(name);
    plugin.config.clear();
    this.updateExportOptions();
  }

  async prune() {
    await this._runNpm('prune');
  }

  getServices(pluginName) {
    return require(path.join(this.cwd, 'node_modules', pluginName)).shareServices;
  }

  getInstalled() {
    return this._pluginNames().map(name => {
      const pluginPath = this._pluginPath(name, 'package.json');
      const json = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
      const plugin = new Plugin(name);
      return {
        ...json,
        prettyName: this._getPrettyName(name),
        hasConfig: this.getServices(name).some(({config = {}}) => Object.keys(config).length > 0),
        isValid: plugin.isConfigValid(),
        kapVersion: json.kapVersion || '*',
        isCompatible: satisfies(this.appVersion, json.kapVersion || '*'),
        installed: true
      };
    });
  }

  async getFromNpm() {
    const url = 'https://api.npms.io/v2/search?q=keywords:kap-plugin+not:deprecated';
    const response = await got(url, {json: true});
    const installed = this._pluginNames();

    return Promise.all(response.body.results
      .map(x => x.package)
      .filter(x => x.name.startsWith('kap-'))
      .filter(x => !installed.includes(x.name)) // Filter out installed plugins
      .map(async x => {
        const {kapVersion = '*'} = await packageJson(x.name, {fullMetadata: true});
        return {
          ...x,
          kapVersion,
          prettyName: this._getPrettyName(x.name),
          isCompatible: satisfies(this.appVersion, kapVersion)
        };
      }));
  }

  getPluginService(pluginName, serviceTitle) {
    return this.getServices(pluginName).find(shareService => shareService.title === serviceTitle);
  }

  async openPluginConfig(name) {
    await openConfigWindow(name);
    const plugin = new Plugin(name);
    return plugin.isConfigValid();
  }
}

const plugins = new Plugins();
module.exports = plugins;
