import electron from 'electron';
import {Container} from 'unstated';

export default class ConfigContainer extends Container {
  remote = electron.remote || false;

  state = {}

  setPlugin(pluginName, services) {
    console.log(pluginName, services);
    this.setState({pluginName, services});
    const Plugin = this.remote.require('./plugin');
    this.plugin = new Plugin(pluginName);
    this.config = this.plugin.getConfig();
    this.validators = this.plugin.validators;
    this.setState({
      validators: this.validators,
      values: this.config.store
    });
  }
}
