const Ajv = require('ajv');

const hexColorValidator = () => {
  return {
    type: 'string',
    pattern: /^((0x)|#)([\dA-Fa-f]{8}|[\dA-Fa-f]{6})$/.source
  };
};

const acceleratorValidator = () => {
  return {
    type: 'string'
  };
};

const validators = new Map([
  ['hexColor', hexColorValidator],
  ['accelerator', acceleratorValidator]
]);

class CustomAjv extends Ajv {
  constructor(options) {
    super(options);

    this.addKeyword('customType', {
      macro: (schema, parentSchema) => {
        return validators.get(schema)(parentSchema);
      },
      metaSchema: {
        type: 'string',
        enum: [...validators.keys()]
      }
    });
  }
}

module.exports = CustomAjv;
