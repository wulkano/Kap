import {Container} from 'unstated';

export default class ConfigContainer extends Container {
  remote = process.type === 'browser' ? false : require('@electron/remote');

  state = {selectedTab: 0};

  setPlugin(pluginName) {
    const {InstalledPlugin} = this.remote.require('./plugins/plugin');
    this.plugin = new InstalledPlugin(pluginName);
    this.config = this.plugin.config;
    this.validators = this.config.validators;
    this.validate();
    this.setState({
      validators: this.validators,
      values: this.config.store,
      pluginName
    });
  }

  setEditService = (pluginName, serviceTitle) => {
    const {InstalledPlugin} = this.remote.require('./plugins/plugin');
    this.plugin = new InstalledPlugin(pluginName);
    this.config = this.plugin.config;
    this.validators = this.config.validators.filter(({title}) => title === serviceTitle);
    this.validate();
    this.setState({
      validators: this.validators,
      values: this.config.store,
      pluginName,
      serviceTitle
    });
  };

  validate = () => {
    for (const validator of this.validators) {
      validator.validate(this.config.store);
    }
  };

  closeWindow = () => this.remote.getCurrentWindow().close();

  openConfig = () => this.plugin.openConfigInEditor();

  viewOnGithub = () => this.plugin.viewOnGithub();

  onChange = (key, value) => {
    if (value === undefined) {
      this.config.delete(key);
    } else {
      this.config.set(key, value);
    }

    this.validate();
    this.setState({values: this.config.store});
  };

  selectTab = selectedTab => {
    this.setState({selectedTab});
  };
}
