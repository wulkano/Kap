import {app} from 'electron';
import {EventEmitter} from 'events';
import path from 'path';
import fs from 'fs';
import makeDir from 'make-dir';
import execa from 'execa';
import {track} from '../common/analytics';
import {InstalledPlugin, NpmPlugin} from './plugin';
import {showError} from '../utils/errors';
import {openPrefsWindow} from '../preferences';
import {notify} from '../utils/notifications';
import packageJson from 'package-json';
import {NormalizedPackageJson} from 'read-pkg';

const got = require('got');

type PackageJson = {
  dependencies: {[key: string]: string}
}

class Plugins extends EventEmitter {
  yarnBin = path.join(__dirname, '../../node_modules/yarn/bin/yarn.js');
  appVersion = app.getVersion();
  pluginsDir = path.join(app.getPath('userData'), 'plugins');
  builtInDir = path.join(__dirname, 'built-in');
  packageJsonPath = path.join(this.pluginsDir, 'package.json');
  installedPlugins: InstalledPlugin[] = [];

  constructor() {
    super();
    this.makePluginsDir();
    this.loadPlugins();
  }

  private makePluginsDir() {
    if (!fs.existsSync(this.packageJsonPath)) {
      makeDir.sync(this.pluginsDir);
      fs.writeFileSync(this.packageJsonPath, JSON.stringify({dependencies: {}}, null, 2));
    }
  }

  private modifyMainPackageJson(modifier: (pkg: PackageJson) => void) {
    const pkg = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    modifier(pkg);
    fs.writeFileSync(this.packageJsonPath, JSON.stringify(pkg, null, 2));
  }

  private async runYarn(...args: string[]) {
    await execa(process.execPath, [this.yarnBin, ...args], {
      cwd: this.pluginsDir,
      env: {
        ELECTRON_RUN_AS_NODE: '1',
        NODE_ENV: 'development'
      }
    });
  }

  private get pluginNames() {
    const pkg = fs.readFileSync(this.packageJsonPath, 'utf8');
    return Object.keys(JSON.parse(pkg).dependencies || {});
  }

  private async yarnInstall() {
    await this.runYarn('install', '--no-lockfile', '--registry', 'https://registry.npmjs.org');
  }

  private loadPlugins() {
    this.installedPlugins = this.pluginNames.map(name => new InstalledPlugin(name));
  }

  async install(name: string) {
    track(`plugin/installed/${name}`);

    this.modifyMainPackageJson(pkg => {
      if (!pkg.dependencies) {
        pkg.dependencies = {};
      }

      pkg.dependencies[name] = 'latest';
    });

    try {
      await this.yarnInstall();

      const plugin = new InstalledPlugin(name);
      this.installedPlugins.push(plugin);

      if (plugin.content.didInstall && typeof plugin.content.didInstall === 'function') {
        try {
          await plugin.content.didInstall?.(plugin.config);
        } catch (error) {
          showError(error, {plugin} as any);
        }
      }

      const {isValid, hasConfig} = plugin;

      const openConfig = () => openPrefsWindow({target: {name, action: 'configure'}});

      const options = (isValid && !hasConfig) ? {
        title: 'Plugin installed',
        body: `"${plugin.prettyName}" is ready for use`
      } : {
        title: plugin.isValid ? 'Plugin installed' : 'Configure plugin',
        body: `"${plugin.prettyName}" ${plugin.isValid ? 'can be configured' : 'requires configuration'}`,
        click: openConfig,
        actions: [
          {type: 'button' as const, text: 'Configure', action: openConfig},
          {type: 'button' as const, text: 'Later'}
        ]
      };

      notify(options)

      const validServices = plugin.config.validServices;

      for (const service of plugin.recordServices) {
        if (!service.willEnable && validServices.includes(service.title)) {
          plugin.enableService(service);
        }
      }

      this.emit('installed', plugin);
    } catch (error) {
      notify.simple(`Something went wrong while installing ${name}`);
      this.modifyMainPackageJson(pkg => {
        delete pkg.dependencies[name];
      });
      console.log(error);
    }
  }

  async uninstall(name: string) {
    track(`plugin/uninstalled/${name}`);
    this.modifyMainPackageJson(pkg => {
      delete pkg.dependencies[name];
    });
    const plugin = new InstalledPlugin(name);

    if (plugin.content.willUninstall && typeof plugin.content.willUninstall === 'function') {
      try {
        await plugin.content.willUninstall?.(plugin.config);
      } catch (error) {
        showError(error, {plugin} as any);
      }
    }

    this.installedPlugins = this.installedPlugins.filter(plugin => plugin.name !== name);
    plugin.config.clear();
    this.emit('uninstalled', name);

    const json = plugin.json as NormalizedPackageJson;

    return new NpmPlugin(json, {
      version: json.kapVersion,
      ...json.kap
    });
  }

  async upgrade() {
    return this.yarnInstall();
  }

  async getFromNpm() {
    const url = 'https://api.npms.io/v2/search?q=keywords:kap-plugin+not:deprecated';
    const response = (await got(url, {json: true})) as {
      body: {results: {package: NormalizedPackageJson}[]}
    };
    const installed = this.pluginNames;

    return Promise.all(response.body.results
      .map(x => x.package)
      .filter(x => x.name.startsWith('kap-'))
      .filter(x => !installed.includes(x.name)) // Filter out installed plugins
      .map(async x => {
        const {kap, kapVersion} = await packageJson(x.name, {fullMetadata: true}) as any;
        return new NpmPlugin(x, {
          // Keeping for backwards compatibility
          version: kapVersion,
          ...kap
        });
      }));
  }

  get allPlugins() {
    return [
      ...this.installedPlugins,
      new InstalledPlugin('_copyToClipboard', path.resolve(this.builtInDir, 'copy-to-clipboard-plugin')),
      new InstalledPlugin('_saveToDisk', path.resolve(this.builtInDir, 'save-file-plugin')),
      new InstalledPlugin('_openWith', path.resolve(this.builtInDir, 'open-with-plugin')),
    ];
  }

  get sharePlugins() {
    return this.allPlugins.filter(plugin => plugin.shareServices.length > 0);
  }

  get editPlugins() {
    return this.allPlugins.filter(plugin => plugin.editServices.length > 0);
  }

  get recordingPlugins() {
    return this.allPlugins.filter(plugin => plugin.recordServices.length > 0);
  }
}

const plugins = new Plugins();

export default plugins;
