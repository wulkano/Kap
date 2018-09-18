import electron from 'electron';
import {Container} from 'unstated';

export default class ConfigContainer extends Container {
  remote = electron.remote || false;

  state = {selectedTab: 0}

  setPlugin(pluginName) {
    const Plugin = this.remote.require('./plugin');
    this.plugin = new Plugin(pluginName);
    this.config = this.plugin.getConfig();
    this.validators = this.plugin.validators;
    this.validate();
    this.setState({
      validators: this.validators,
      values: this.config.store,
      pluginName
    });
  }

  validate = () => {
    for (const validator of this.validators) {
      validator(this.config.store);
    }
  }

  onChange = (key, value) => {
    if (value === undefined) {
      this.config.delete(key);
    } else {
      this.config.set(key, value);
    }
    this.validate();
    this.setState({values: this.config.store});
  }

  selectTab = selectedTab => {
    this.setState({selectedTab});
  }
}
