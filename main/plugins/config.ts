import {ValidateFunction} from 'ajv';
import Store, {Schema as JSONSchema} from 'electron-store';
import Ajv, {Schema} from '../utils/ajv';
import {Service} from './service';

export default class PluginConfig extends Store {
  servicesWithNoConfig: Service[];
  validators: {
    title: string;
    description?: string;
    config: {[key: string]: Schema}
    validate: ValidateFunction
  }[]

  constructor(name: string, services: Service[]) {
    const defaults = {};

    const validators = services
      .filter(({config}) => Boolean(config))
      .map(service => {
        const config = service.config as {[key: string]: Schema};
        const schema: {[key: string]: JSONSchema} = {};
        const requiredKeys = [];

        for (const key of Object.keys(config)) {
          if (!config[key].title) {
            throw new Error('Config schema items should have a `title`');
          }

          const {required, ...rest} = config[key];

          if (required) {
            requiredKeys.push(key);
          }

          schema[key] = rest;
        }

        const ajv = new Ajv({
          format: 'full',
          useDefaults: true,
          errorDataPath: 'property',
          allErrors: true
        });

        const validator = ajv.compile({
          type: 'object',
          properties: schema,
          required: requiredKeys
        });

        validator(defaults);
        return {
          validate: validator,
          title: service.title,
          description: service.configDescription,
          config: config
        }
      });

    super({
      name,
      cwd: 'plugins',
      defaults
    });

    this.servicesWithNoConfig = services.filter(({config}) => !config);
    this.validators = validators;
  }

  get isValid() {
    return this.validators.reduce(
      (isValid, validator) => isValid && (validator.validate(this.store) as boolean),
      true
    );
  }

  get validServices() {
    return [
      ...this.validators.filter(validator => validator.validate(this.store)),
      ...this.servicesWithNoConfig
    ].map(service => service.title);
  }
}
