'use strict';

const electron = require('electron');
const path = require('path');
const Store = require('electron-store');
const Ajv = require('ajv');
const saveFilePlugin = require('./save-file-service');

class Plugin {
  constructor(pluginName) {
    this.pluginName = pluginName;

    if (pluginName === 'default') {
      this.plugin = saveFilePlugin;
    } else {
      const cwd = path.join(electron.app.getPath('userData'), 'plugins');
      this.plugin = require(path.join(cwd, 'node_modules', pluginName));
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
  }

  isConfigValid() {
    const config = this.getConfig();
    return this.validators.reduce((isValid, validator) => isValid && validator(config), true);
  }

  getSerivce(serviceTitle) {
    return this.plugin.shareServices.find(shareService => shareService.title === serviceTitle);
  }

  getConfig() {
    return new Store({
      name: this.pluginName,
      cwd: 'plugins',
      defaults: this.defaults
    });
  }
}

module.exports = Plugin;
