import electron from 'electron';
import {Container} from 'unstated';

export default class ConfigContainer extends Container {
  remote = electron.remote || false;

  state = {}

  setPlugin(pluginName, services) {
    console.log(pluginName, services);
    this.setState({pluginName, services});
  }
}
