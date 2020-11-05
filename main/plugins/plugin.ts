import {app, shell} from 'electron';
import macosVersion from 'macos-version';
import semver from 'semver';
import path from 'path';
import fs from 'fs';
import readPkg from 'read-pkg';
import {RecordService, ShareService, EditService} from './service';
import {showError} from '../utils/errors';
import PluginConfig from './config';
import Store from 'electron-store';

export const recordPluginServiceState = new Store<{[key: string]: boolean}>({
  name: 'record-plugin-state',
  defaults: {}
});

class BasePlugin {
  name: string;
  kapVersion?: string;
  macosVersion?: string;
  link?: string;
  json?: readPkg.NormalizedPackageJson;

  constructor(pluginName: string) {
    this.name = pluginName
  }

  get prettyName() {
    return this.name.replace(/^kap-/, '');
  }

  get isCompatible() {
    return semver.satisfies(app.getVersion(), this.kapVersion || '*') && macosVersion.is(this.macosVersion || '*');
  }

  get repoUrl() {
    if (!this.link) {
      return;
    }

    const url = new URL(this.link);
    url.hash = '';
    return url.href;
  }

  get version() {
    return this.json?.version;
  }

  get description() {
    return this.json?.description;
  }

  viewOnGithub() {
    if (this.link) {
      shell.openExternal(this.link)
    }
  }
}

export interface KapPlugin<Config = any> {
  shareServices?: ShareService<Config>[];
  editServices?: EditService<Config>[];
  recordServices?: RecordService<Config>[];

  didConfigChange?: (newValue: Readonly<any> | undefined, oldValue: Readonly<any> | undefined, config: Store<Config>) => void | Promise<void>;
  didInstall?: (config: Store<Config>) => void | Promise<void>;
  willUninstall?: (config: Store<Config>) => void | Promise<void>;
}

export class InstalledPlugin extends BasePlugin {
  isInstalled = true;
  pluginsPath = path.join(app.getPath('userData'), 'plugins');

  pluginPath: string;
  json?: readPkg.NormalizedPackageJson;
  content: KapPlugin;
  config: PluginConfig;
  hasConfig: boolean;
  isBuiltIn: boolean;

  constructor(pluginName: string, customPath?: string) {
    super(pluginName);

    this.pluginPath = customPath || path.join(this.pluginsPath, 'node_modules', pluginName);
    this.isBuiltIn = Boolean(customPath);

    if (!this.isBuiltIn) {
      this.json = readPkg.sync({cwd: this.pluginPath});
      this.link = this.json.homepage ?? this.json.links?.homepage;

      // Keeping for backwards compatibility
      this.kapVersion = this.json.kap?.version ?? this.json.kapVersion;
      this.macosVersion = this.json.kap?.macosVersion;
    }

    try {
      this.content = require(this.pluginPath);
      this.config = new PluginConfig(pluginName, this.allServices);
      this.hasConfig = this.allServices.some(({config = {}}) => Object.keys(config).length > 0);

      if (this.content.didConfigChange && typeof this.content.didConfigChange === 'function') {
        this.config.onDidAnyChange((newValue, oldValue) => this.content.didConfigChange?.(newValue, oldValue, this.config));
      }
    } catch (error) {
      showError(error, {title: `Something went wrong while loading “${pluginName}”`, plugin: this});

      this.content = {};
      this.config = new PluginConfig(pluginName, []);
      this.hasConfig = false;
    }
  }

  get isSymLink() {
    return fs.lstatSync(this.pluginPath).isSymbolicLink();
  }

  get shareServices() {
    return this.content.shareServices || [];
  }

  get editServices() {
    return this.content.editServices || [];
  }

  get recordServices() {
    return this.content.recordServices || [];
  }

  get allServices() {
    return [
      ...this.shareServices,
      ...this.editServices,
      ...this.recordServices
    ];
  }

  get isValid() {
    return this.config.isValid;
  }

  get recordServicesWithStatus() {
    return this.recordServices.map(service => ({
      ...service,
      isEnabled: recordPluginServiceState.get(`${this.name}-${service.title}`, false)
    }));
  }

  enableService(service: RecordService) {
    recordPluginServiceState.set(`${this.name}-${service.title}`, true);
  }

  openConfig() {
    this.config.openInEditor();
  }
}

export class NpmPlugin extends BasePlugin {
  isInstalled = false;

  constructor(json: readPkg.NormalizedPackageJson, kap: {version?: string, macosVersion?: string} = {}) {
    super(json.name);

    this.json = json;
    this.kapVersion = kap.version;
    this.macosVersion = kap.macosVersion;
    this.link = this.json.homepage ?? this.json.links?.homepage;
  }
}
