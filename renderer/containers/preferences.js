import electron from 'electron';
import {Container} from 'unstated';

export default class PreferencesContainer extends Container {
  remote = electron.remote || false;

  state = {}

  mount = async () => {
    this.settings = this.remote.require('./common/settings');
    this.plugins = this.remote.require('./common/plugins');

    const installed = this.plugins.getInstalled().sort((a, b) => a.prettyName.localeCompare(b.prettyName));
    const fromNpm = (await this.plugins.getFromNpm()).sort((a, b) => a.prettyName.localeCompare(b.prettyName));

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
      audioDevices,
      installed,
      fromNpm
    });
  }

  install = async name => {
    const {installed, fromNpm} = this.state;
    const plugin = fromNpm.find(p => p.name === name);

    this.setState({installing: name});
    await this.plugins.install(name);

    this.setState({
      installing: '',
      fromNpm: fromNpm.filter(p => p.name !== name),
      installed: [plugin, ...installed].sort((a, b) => a.prettyName.localeCompare(b.prettyName))
    });
  }

  uninstall = name => {
    const {installed, fromNpm} = this.state;
    const plugin = installed.find(p => p.name === name);

    document.querySelector(`#${name} .checked`).classList.remove('checked');
    setTimeout(() => {
      this.setState({
        installed: installed.filter(p => p.name !== name),
        fromNpm: [plugin, ...fromNpm].sort((a, b) => a.prettyName.localeCompare(b.prettyName))
      });
    }, 200);

    this.plugins.uninstall(name);
  }

  openPluginsFolder = () => electron.shell.openItem(this.plugins.cwd);

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
