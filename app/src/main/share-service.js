import electron from 'electron';
import Store from 'electron-store';
import Ajv from 'ajv';
import delay from 'delay';
import ShareServiceContext from './share-service-context';

const REQUIRED_KEYS = new Set([
  'title',
  'formats',
  'action',
  'pluginName'
]);

export default class ShareService {
  constructor(options) {
    for (const key of REQUIRED_KEYS) {
      if (!(key in options)) {
        throw new Error(`Missing required key \`${key}\``);
      }
    }

    options = Object.assign({}, options);
    options.config = Object.assign({}, options.config);
    this.options = options;

    this.title = options.title;
    this.formats = options.formats;
    this._action = options.action;
    this.pluginName = options.pluginName;

    this._initConfig();
  }

  _initConfig() {
    const schemaProps = this.options.config;

    const ajv = new Ajv({
      format: 'full',
      useDefaults: true,
      errorDataPath: 'property'
    });

    // Adds support for `required` key in the properties schemas
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

    this.validateConfig = ajv.compile(schema);

    const defaults = {};
    this.validateConfig(defaults); // Adds defaults from schema

    this.config = new Store({
      name: this.pluginName,
      cwd: 'plugins',
      defaults
    });
  }

  showError(err) {
    electron.dialog.showErrorBox(`Error in plugin ${this.pluginName}`, err.stack);
  }

  async run(exportOptions) { // `exportOptions` => format filePath width height fps loop
    const valid = this.validateConfig(this.config.store);
    if (!valid) {
      const err = this.validateConfig.errors[0];

      (new electron.Notification({
        title: this.pluginName,
        body: `Config \`${err.dataPath.slice(1)}\` ${err.message}`
      })).show();

      this.config.openInEditor();
      return;
    }

    const context = new ShareServiceContext(exportOptions);
    context._pluginName = this.pluginName;
    context.config = this.config;

    const kap = electron.app.kap;
    kap.editorWindow.send('toggle-format-buttons', {enabled: false});

    // We delay it a tiny bit so it doesn't flash if the `_action` was canceled
    delay(50).then(() => {
      if (!context.canceled) {
        kap.mainWindow.send('start-export');
      }
    });

    try {
      await this._action(context);

      if (context.canceled) {
        kap.mainWindow.send('hide-export-window');
      } else {
        kap.mainWindow.send('end-export');
      }
    } catch (err) {
      kap.mainWindow.send('hide-export-window');
      this.showError(err);
    }

    kap.editorWindow.send('toggle-format-buttons', {enabled: true});

    return context;
  }
}
