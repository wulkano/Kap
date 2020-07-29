'use strict';

const path = require('path');
const fs = require('fs');
const electron = require('electron');
const got = require('got');
const execa = require('execa');
const makeDir = require('make-dir');
const packageJson = require('package-json');

const {app, Notification} = electron;

const {refreshRecordPluginItems} = require('../menus');
const {openConfigWindow} = require('../config');
const {openPrefsWindow} = require('../preferences');
const {notify} = require('./notifications');
const {track} = require('./analytics');
const {InstalledPlugin, NpmPlugin, recordPluginServiceState} = require('../plugin');
const {showError} = require('../utils/errors');

// Need to persist the notification, otherwise it is garbage collected and the actions don't trigger
// https://github.com/electron/electron/issues/12690
let pluginNotification;

class Plugins {
  constructor() {
    this.yarnBin = path.join(__dirname, '../../node_modules/yarn/bin/yarn.js');
    this._makePluginsDir();
    this.appVersion = app.getVersion();
    this.refreshRecordPluginServices();
  }

  setUpdateExportOptions(updateExportOptions) {
    this.updateExportOptions = updateExportOptions;
  }

  async enableService(service, plugin) {
    const wasEnabled = recordPluginServiceState.get(service.title) || false;

    if (wasEnabled) {
      recordPluginServiceState.set(service.title, false);
      return this.refreshRecordPluginServices();
    }

    if (!plugin.config.validServices.includes(service.title)) {
      openPrefsWindow({target: {name: plugin.name, action: 'configure'}});
      return;
    }

    if (service.willEnable) {
      try {
        const canEnable = await service.willEnable();

        if (canEnable) {
          recordPluginServiceState.set(service.title, true);
        }
      } catch (error) {
        showError(error, {title: `Something went wrong while enabling “${service.title}”`});
        const Sentry = require('./utils/sentry');
        Sentry.captureException(error);
      }

      this.refreshRecordPluginServices();
      return;
    }

    recordPluginServiceState.set(service.title, true);
    this.refreshRecordPluginServices();
  }

  refreshRecordPluginServices = () => {
    refreshRecordPluginItems(
      this.getRecordingPlugins().flatMap(
        plugin => plugin.recordServices.map(service => ({
          ...service,
          isEnabled: recordPluginServiceState.get(service.title) || false,
          toggleEnabled: () => this.enableService(service, plugin)
        }))
      )
    );
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
    fs.writeFileSync(this.pkgPath, JSON.stringify(pkg, null, 2));
  }

  async _runYarn(...commands) {
    await execa(process.execPath, [this.yarnBin, ...commands], {
      cwd: this.cwd,
      env: {
        ELECTRON_RUN_AS_NODE: 1
      }
    });
  }

  _pluginNames() {
    const pkg = fs.readFileSync(path.join(this.cwd, 'package.json'), 'utf8');
    return Object.keys(JSON.parse(pkg).dependencies || {});
  }

  async _yarnInstall() {
    await this._runYarn('install', '--no-lockfile', '--registry', 'https://registry.npmjs.org');
  }

  async install(name) {
    track(`plugin/installed/${name}`);
    // We manually add it to the package.json here so we're able to set the version to `latest`
    this._modifyMainPackageJson(pkg => {
      if (!pkg.dependencies) {
        pkg.dependencies = {};
      }

      pkg.dependencies[name] = 'latest';
    });

    try {
      await this._yarnInstall();

      const plugin = new InstalledPlugin(name);

      if (plugin.plugin.didInstall && typeof plugin.plugin.didInstall === 'function') {
        try {
          await plugin.plugin.didInstall(plugin.config);
        } catch (error) {
          showError(error, {plugin});
        }
      }

      const {isValid, hasConfig} = plugin;

      const options = (isValid && !hasConfig) ? {
        title: 'Plugin installed',
        body: `"${plugin.prettyName}" is ready for use`
      } : {
        title: plugin.isValid ? 'Plugin installed' : 'Configure plugin',
        body: `"${plugin.prettyName}" ${plugin.isValid ? 'can be configured' : 'requires configuration'}`,
        actions: [
          {type: 'button', text: 'Configure'},
          {type: 'button', text: 'Later'}
        ]
      };

      pluginNotification = new Notification(options);

      if (!isValid || hasConfig) {
        const openConfig = () => openPrefsWindow({target: {name, action: 'configure'}});

        pluginNotification.on('click', openConfig);

        pluginNotification.on('action', (_, index) => {
          if (index === 0) {
            openConfig();
          } else {
            pluginNotification.close();
          }
        });
      }

      for (const service of plugin.config.validServices) {
        if (!service.willEnable) {
          recordPluginServiceState.set(service, true);
        }
      }

      pluginNotification.show();
      this.updateExportOptions();
      this.refreshRecordPluginServices();

      return plugin;
    } catch (error) {
      notify(`Something went wrong while installing ${name}`);
      this._modifyMainPackageJson(pkg => {
        delete pkg.dependencies[name];
      });
      console.log(error);
    }
  }

  async upgrade() {
    await this._yarnInstall();
  }

  async uninstall(name) {
    track(`plugin/uninstalled/${name}`);
    this._modifyMainPackageJson(pkg => {
      delete pkg.dependencies[name];
    });
    const plugin = new InstalledPlugin(name);

    if (plugin.plugin.willUninstall && typeof plugin.plugin.willUninstall === 'function') {
      try {
        await plugin.plugin.willUninstall(plugin.config);
      } catch (error) {
        showError(error, {plugin});
      }
    }

    plugin.config.clear();
    this.updateExportOptions();
    return new NpmPlugin(plugin.json, {
      // Keeping for backwards compatibility
      version: plugin.json.kapVersion,
      ...plugin.json.kap
    });
  }

  async prune() {
    await this._yarnInstall();
  }

  getServices(pluginName) {
    const {
      shareServices = [],
      recordServices = []
    } = require(path.join(this.cwd, 'node_modules', pluginName));

    return [...shareServices, ...recordServices];
  }

  getInstalled() {
    try {
      return this._pluginNames().map(name => new InstalledPlugin(name));
    } catch (error) {
      showError(error);
      const Sentry = require('../utils/sentry');
      Sentry.captureException(error);
      return [];
    }
  }

  getSharePlugins() {
    return this.getInstalled().filter(plugin => plugin.shareServices.length > 0);
  }

  getRecordingPlugins() {
    return this.getInstalled().filter(plugin => plugin.recordServices.length > 0);
  }

  getEditPlugins() {
    return this.getInstalled().filter(plugin => plugin.editServices.length > 0);
  }

  getBuiltIn() {
    return [{
      pluginPath: './plugins/copy-to-clipboard-plugin',
      isCompatible: true,
      name: '_copyToClipboard'
    }, {
      pluginPath: './plugins/save-file-plugin',
      isCompatible: true,
      name: '_saveToDisk'
    }, {
      pluginPath: './plugins/open-with-plugin',
      isCompatible: true,
      name: '_openWith'
    }];
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
        const {kap, kapVersion} = await packageJson(x.name, {fullMetadata: true});
        return new NpmPlugin(x, {
          // Keeping for backwards compatibility
          version: kapVersion,
          ...kap
        });
      }));
  }

  getPluginService(pluginName, serviceTitle) {
    return this.getServices(pluginName).find(shareService => shareService.title === serviceTitle);
  }

  async openPluginConfig(name) {
    await openConfigWindow(name);
    const plugin = new InstalledPlugin(name);
    return plugin.isValid;
  }
}

const plugins = new Plugins();
module.exports = plugins;
