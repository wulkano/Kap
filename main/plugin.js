'use strict';

const electron = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const Ajv = require('ajv');
const saveFilePlugin = require('./save-file-service');
const copyToClipboardPlugin = require('./copy-to-clipboard-plugin');

const {app, shell} = electron;

class Plugin {
  constructor(pluginName) {
    this.pluginName = pluginName;

    if (pluginName === '_saveToDisk') {
      this.plugin = saveFilePlugin;
      this._isBuiltin = true;
    } else if (pluginName === '_copyToClipboard') {
      this.plugin = copyToClipboardPlugin;
      this._isBuiltin = true;
    } else {
      const cwd = path.join(app.getPath('userData'), 'plugins');
      const pluginPath = path.join(cwd, 'node_modules', pluginName);
      this.plugin = require(pluginPath);
      const {homepage, links} = JSON.parse(fs.readFileSync(path.join(pluginPath, 'package.json'), 'utf8'));
      this.link = homepage || (links && links.homepage);
    }

    this.defaults = {};

    this.validators = this.plugin.shareServices.filter(({config}) => Boolean(config)).map(service => {
      const schemaProps = JSON.parse(JSON.stringify(service.config));
      const requiredKeys = [];
      for (const key of Object.keys(schemaProps)) {
        if (!schemaProps[key].title) {
          throw new Error('Config schema items should have a `title`');
        }

        if (schemaProps[key].required === true) {
          delete schemaProps[key].required;
          requiredKeys.push(key);
        }
      }

      const schema = {
        type: 'object',
        properties: schemaProps,
        required: requiredKeys
      };

      const ajv = new Ajv({
        format: 'full',
        useDefaults: true,
        errorDataPath: 'property',
        allErrors: true
      });

      const validator = ajv.compile(schema);
      validator(this.defaults);
      validator.title = service.title;
      validator.config = service.config;

      return validator;
    });

    this.config = new Store({
      name: this.pluginName,
      cwd: 'plugins',
      defaults: this.defaults
    });
  }

  isConfigValid() {
    return this.validators.reduce((isValid, validator) => isValid && validator(this.config.store), true);
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
