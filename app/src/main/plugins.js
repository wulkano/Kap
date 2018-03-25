import path from 'path';
import fs from 'fs';
import electron from 'electron';
import got from 'got';
import execa from 'execa';
import makeDir from 'make-dir';
import ShareService from './share-service';
import saveFileService from './save-file-service';

class Plugins {
  constructor() {
    this.npmBin = path.join(__dirname, '../../node_modules/npm/bin/npm-cli.js');
    this.cwd = this._makePluginsDir();
  }

  _makePluginsDir() {
    const cwd = path.join(electron.app.getPath('userData'), 'plugins');
    const fp = path.join(cwd, 'package.json');

    if (!fs.existsSync(fp)) {
      makeDir.sync(cwd);
      fs.writeFileSync(fp, '{"dependencies":{}}');
    }

    return cwd;
  }

  _addPrettyName(pkg) {
    pkg.prettyName = pkg.name.replace(/^kap-/, '');
  }

  _pluginNames() {
    const pkg = fs.readFileSync(path.join(this.cwd, 'package.json'), 'utf8');
    return Object.keys(JSON.parse(pkg).dependencies);
  }

  _modifyMainPackageJson(modifier) {
    const pkgPath = path.join(this.cwd, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    modifier(pkg);
    fs.writeFileSync(pkgPath, JSON.stringify(pkg));
  }

  _pluginPath(name, subPath = '') {
    return path.join(this.cwd, 'node_modules', name, subPath);
  }

  async _runNpm(...commands) {
    await execa(process.execPath, [this.npmBin, ...commands], {
      cwd: this.cwd,
      env: {
        ELECTRON_RUN_AS_NODE: 1
      }
    });
  }

  async upgrade() {
    await this._runNpm('install');
  }

  async install(name) {
    // We manually add it to the package.json here so we're able to set the version to `latest`
    this._modifyMainPackageJson(pkg => {
      pkg.dependencies[name] = 'latest';
    });

    await this._runNpm('install');
  }

  async uninstall(name) {
    this._modifyMainPackageJson(pkg => {
      delete pkg.dependencies[name];
    });

    // Intentionally not awaited as it can just finish in the background
    this._runNpm('prune');
  }

  all() {
    return this._pluginNames().map(name => {
      const pth = this._pluginPath(name, 'package.json');
      const json = JSON.parse(fs.readFileSync(pth, 'utf8'));
      this._addPrettyName(json);
      return json;
    });
  }

  async getFromNpm() {
    const url = 'https://api.npms.io/v2/search?q=keywords:kap-plugin';
    const response = await got(url, {json: true});

    return response.body.results
      .map(x => x.package)
      .filter(x => x.name.startsWith('kap-'))
      .filter(x => !this._pluginNames().includes(x.name)) // Filter out installed plugins
      .map(x => {
        this._addPrettyName(x);
        return x;
      });
  }

  load() {
    const defaultPlugin = {
      name: 'kap',
      shareServices: [
        saveFileService
      ]
    };

    const plugins = this._pluginNames().map(name => {
      const plugin = require(path.join(this.cwd, 'node_modules', name));
      plugin.name = name;
      return plugin;
    });

    return [defaultPlugin, ...plugins];
  }

  getShareServices() {
    const ret = [];

    for (const plugin of this.load()) {
      if (plugin.shareServices) {
        for (const service of plugin.shareServices) {
          try {
            ret.push(new ShareService(Object.assign({}, service, {pluginName: plugin.name})));
          } catch (err) {
            electron.dialog.showErrorBox(`Error in plugin ${plugin.name}`, err.stack);
          }
        }
      }
    }

    return ret;
  }

  getShareServicesPerFormat() {
    const ret = {};

    for (const service of this.getShareServices()) {
      for (const format of service.formats) {
        ret[format] = ret[format] || [];
        ret[format].push(service);
      }
    }

    return ret;
  }

  prettifyFormat(format) {
    const formats = new Map([
      ['apng', 'APNG'],
      ['gif', 'GIF'],
      ['mp4', 'MP4'],
      ['original', 'Original'],
      ['webm', 'WebM']
    ]);

    return formats.get(format);
  }

  formatExtension(format) {
    if (format === 'original') {
      return 'mp4';
    }

    return format;
  }
}

const plugins = new Plugins();
export default plugins;
