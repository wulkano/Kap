import electron from 'electron';
import {Container} from 'unstated';

export default class PreferencesContainer extends Container {
  remote = electron.remote || false;

  state = {}

  mount = async () => {
    this.settings = this.remote.require('./common/settings');

    const {getAudioDevices} = this.remote.require('./common/aperture');
    const {audioInputDeviceId} = this.settings.store;

    const audioDevices = await getAudioDevices();

    if (!audioDevices.find(device => device.id === audioInputDeviceId)) {
      this.settings.set('audioInputDeviceId', audioDevices[0] && audioDevices[0].id);
    }

    this.setState({
      ...this.settings.store,
      category: 'general',
      openOnStartup: this.remote.app.getLoginItemSettings().openAtLogin,
      audioDevices
    });
  }

  selectCategory = category => {
    this.setState({category});
  }

  toggleSetting = (setting, value) => {
    const newVal = value === undefined ? !this.state[setting] : value;
    this.setState({[setting]: newVal});
    this.settings.set(setting, newVal);
  }

  setOpenOnStartup = value => {
    const openOnStartup = typeof value === 'boolean' ? value : !this.state.openOnStartup;
    this.setState({openOnStartup});
    this.remote.app.setLoginItemSettings({openAtLogin: openOnStartup});
  }

  pickKapturesDir = () => {
    const {dialog, getCurrentWindow} = this.remote;

    const directories = dialog.showOpenDialog(getCurrentWindow(), {properties: ['openDirectory', 'createDirectory']});
    this.toggleSetting('kapturesDir', directories[0]);
  }

  setAudioInputDeviceId = id => {
    this.setState({audioInputDeviceId: id});
    this.settings.set('audioInputDeviceId', id);
  }
}
