import Store from 'electron-store';
import Ajv from './ajv';

class PluginConfig extends Store {
  constructor(plugin) {
    const defaults = {};

    const validators = plugin.allServices.filter(({config}) => Boolean(config)).map(service => {
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

      validator(defaults);
      validator.title = service.title;
      validator.description = service.configDescription;
      validator.config = service.config;

      return validator;
    });

    super({
      name: plugin.name,
      cwd: 'plugins',
      defaults
    });

    this.servicesWithNoConfig = plugin.allServices.filter(({config}) => !config);
    this.validators = validators;
  }

  isConfigValid() {
    return this.validators.reduce((isValid, validator) => isValid && validator(this.store), true);
  }

  get validServices() {
    return [
      ...this.validators.filter(validator => validator(this.store)),
      ...this.servicesWithNoConfig
    ].map(service => service.title);
  }
}

module.exports = PluginConfig;
