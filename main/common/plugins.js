const path = require('path');
const fs = require('fs');
const electron = require('electron');
const got = require('got');
const execa = require('execa');
const makeDir = require('make-dir');

const {notify} = require('./notifications');
const {track} = require('./analytics');

class Plugins {
  constructor() {
    this.npmBin = path.join(__dirname, '../../node_modules/npm/bin/npm-cli.js');
    this._makePluginsDir();
  }

  _makePluginsDir() {
    const cwd = path.join(electron.app.getPath('userData'), 'plugins');
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

  _addPrettyName(pkg) {
    pkg.prettyName = pkg.name.replace(/^kap-/, '');
  }

  _pluginPath(name, subPath = '') {
    return path.join(this.cwd, 'node_modules', name, subPath);
  }

  _pluginNames() {
    const pkg = fs.readFileSync(path.join(this.cwd, 'package.json'), 'utf8');
    return Object.keys(JSON.parse(pkg).dependencies);
  }

  async _npmInstall() {
    await this._runNpm('install', '--registry', 'https://registry.npmjs.org');
  }

  async install(name) {
    track(`plugin/installed/${name}`);
    // We manually add it to the package.json here so we're able to set the version to `latest`
    this._modifyMainPackageJson(pkg => {
      pkg.dependencies[name] = 'latest';
    });

    await this._npmInstall();
    notify(`Successfully installed plugin ${name}`);
  }

  async upgrade() {
    await this._npmInstall();
  }

  async uninstall(name) {
    track(`plugin/uninstalled/${name}`);
    this._modifyMainPackageJson(pkg => {
      delete pkg.dependencies[name];
    });
  }

  async prune() {
    this._runNpm('prune');
  }

  getInstalled() {
    return this._pluginNames().map(name => {
      const path = this._pluginPath(name, 'package.json');
      const json = JSON.parse(fs.readFileSync(path, 'utf8'));
      this._addPrettyName(json);
      return json;
    });
  }

  async getFromNpm() {
    const url = 'https://api.npms.io/v2/search?q=keywords:kap-plugin';
    const response = await got(url, {json: true});
    const installed = this._pluginNames();

    return response.body.results
      .map(x => x.package)
      .filter(x => x.name.startsWith('kap-'))
      .filter(x => !installed.includes(x.name)) // Filter out installed plugins
      .map(x => {
        this._addPrettyName(x);
        return x;
      });
  }

  getPluginService(pluginName, serviceTitle) {
    const plugin = require(path.join(this.cwd, 'node_modules', pluginName));
    const service = plugin.shareServices.find(shareService => shareService.title === serviceTitle);
    return service;
  }
}

const plugins = new Plugins();
module.exports = plugins;
