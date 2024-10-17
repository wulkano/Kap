import {ipcRenderer} from 'electron-better-ipc';
import {Container} from 'unstated';

export default class ConfigContainer extends Container {
  state = {selectedTab: 0};

  setPlugin(pluginName) {
    ipcRenderer.callMain('get-plugin', {pluginName}).then(plugin => {
      this.setState({
        validators: plugin.validators,
        pluginName,
        values: plugin.config
      });
    });
  }

  setEditService = (pluginName, serviceTitle) => {
    ipcRenderer.callMain('get-plugin', {pluginName, serviceTitle}).then(plugin => {
      this.setState({
        validators: plugin.validators,
        pluginName,
        serviceTitle,
        values: plugin.config
      });
    });
  };

  validate = () => {
    ipcRenderer.callMain('get-plugin', {pluginName: this.state.pluginName, serviceTitle: this.state.serviceTitle}).then(plugin => {
      this.setState({
        validators: plugin.validators,
        values: plugin.config
      });
    });
  };

  closeWindow = () => {
    ipcRenderer.callMain('window-action', 'close');
  }

  openConfig = () => {
    ipcRenderer.callMain('plugin-action', {pluginName: this.state.pluginName, action: 'open-config'});
  }

  viewOnGithub = () => {
    ipcRenderer.callMain('plugin-action', {pluginName: this.state.pluginName, action: 'view-on-github'});
  }

  onChange = (key, value) => {
    ipcRenderer.callMain('change-plugin-config', {
      pluginName: this.state.pluginName,
      key,
      value
    }).then(() => {
      this.validate();
    });
  };

  selectTab = selectedTab => {
    this.setState({selectedTab});
  };
}
