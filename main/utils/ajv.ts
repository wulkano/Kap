import Ajv, {Options} from 'ajv';
import {Schema as JSONSchema} from 'electron-store';

export type Schema = Omit<JSONSchema, 'required'> & {
  required?: boolean;
  customType?: string;
}

const hexColorValidator = () => {
  return {
    type: 'string',
    pattern: /^((0x)|#)([\dA-Fa-f]{8}|[\dA-Fa-f]{6})$/.source
  };
};

const keyboardShortcutValidator = () => {
  return {
    type: 'string'
  };
};

const validators: {[key: string]: (parentSchema: object) => object} = {
  'hexColor': hexColorValidator,
  'keyboardShortcut': keyboardShortcutValidator
};

export default class CustomAjv extends Ajv {
  constructor(options: Options) {
    super(options);

    this.addKeyword('customType', {
      macro: (schema, parentSchema) => {
        const validator = validators[schema];

        if (!validator) {
          throw new Error(`No custom type found for ${schema}`);
        }

        return validator(parentSchema);
      },
      metaSchema: {
        type: 'string',
        enum: [Object.keys(validators)]
      }
    });
  }
}
