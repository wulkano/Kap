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

  async upgrade() {
    await execa(process.execPath, [this.npmBin, 'install'], {
      cwd: this.cwd,
      env: {
        ELECTRON_RUN_AS_NODE: 1
      }
    });
  }

  async install(name) {
    // We manually add it to the package.json here so we're able to set the version to `latest`
    const pkgPath = path.join(this.cwd, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.dependencies[name] = 'latest';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg));

    try {
      await this.upgrade();
    } catch (err) {
      console.error(err);
      console.error(err.stderr);
      console.error(err.stdout);
    }
  }

  async uninstall(name) {
    await execa(process.execPath, [this.npmBin, 'uninstall', '--save', name], {
      cwd: this.cwd,
      env: {
        ELECTRON_RUN_AS_NODE: 1
      }
    });
  }

  all() {
    return this._pluginNames().map(name => {
      const pth = path.join(this.cwd, 'node_modules', name, 'package.json');
      const json = JSON.parse(fs.readFileSync(pth, 'utf8'));
      this._addPrettyName(json);
      return json;
    });
  }

  // TODO: Figure out why making this an async function didn't work
  getFromNpm() {
    const url = 'https://api.npms.io/v2/search?q=keywords:kap-plugin';
    return got(url, {json: true}).then(response => {
      return response.body.results
        .map(x => x.package)
        .filter(x => x.name.startsWith('kap-'))
        .filter(x => !this._pluginNames().includes(x.name)) // Filter out installed plugins
        .map(x => {
          this._addPrettyName(x);
          return x;
        });
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
}

const plugins = new Plugins();
export default plugins;
