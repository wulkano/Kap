import electron from 'electron';
import {Container} from 'unstated';
import delay from 'delay';

const SETTINGS_ANALYTICS_BLACKLIST = ['kapturesDir'];

export default class PreferencesContainer extends Container {
  remote = electron.remote || false;

  state = {
    category: 'general',
    tab: 'discover'
  }

  mount = setOverlay => {
    this.setOverlay = setOverlay;
    this.settings = this.remote.require('./common/settings');
    this.plugins = this.remote.require('./common/plugins');
    this.track = this.remote.require('./common/analytics').track;
    this.ipc = require('electron-better-ipc').ipcRenderer;

    const pluginsInstalled = this.plugins.getInstalled().sort((a, b) => a.prettyName.localeCompare(b.prettyName));

    const {getAudioDevices} = this.remote.require('./common/aperture');
    const {audioInputDeviceId} = this.settings.store;

    this.setState({
      ...this.settings.store,
      openOnStartup: this.remote.app.getLoginItemSettings().openAtLogin,
      pluginsInstalled,
      isMounted: true
    });

    this.fetchFromNpm();

    (async () => {
      const audioDevices = await getAudioDevices();
      const updates = {audioDevices};

      if (!audioDevices.some(device => device.id === audioInputDeviceId)) {
        const [device] = audioDevices;
        if (device) {
          this.settings.set('audioInputDeviceId', device.id);
          updates.audioInputDeviceId = device.id;
        }
      }

      this.setState(updates);
    })();
  }

  setNavigation = ({category, tab}) => this.setState({category, tab})

  fetchFromNpm = async () => {
    try {
      const plugins = await this.plugins.getFromNpm();
      this.setState({
        npmError: false,
        pluginsFromNpm: plugins.sort((a, b) => a.prettyName.localeCompare(b.prettyName))
      });
    } catch (error) {
      this.setState({npmError: true});
    }
  }

  install = async name => {
    const {pluginsInstalled, pluginsFromNpm} = this.state;
    const plugin = pluginsFromNpm.find(p => p.name === name);

    this.setState({pluginBeingInstalled: name});
    const result = await this.plugins.install(name);

    if (result) {
      const {isValid, hasConfig} = result;
      plugin.isValid = isValid;
      plugin.hasConfig = hasConfig;
      this.setState({
        pluginBeingInstalled: null,
        pluginsFromNpm: pluginsFromNpm.filter(p => p.name !== name),
        pluginsInstalled: [plugin, ...pluginsInstalled].sort((a, b) => a.prettyName.localeCompare(b.prettyName))
      });
    }
  }

  uninstall = name => {
    const {pluginsInstalled, pluginsFromNpm} = this.state;
    const plugin = pluginsInstalled.find(p => p.name === name);

    const onTransitionEnd = async () => {
      await delay(500);
      plugin.hasConfig = false;
      this.setState({
        pluginsInstalled: pluginsInstalled.filter(p => p.name !== name),
        pluginsFromNpm: [plugin, ...pluginsFromNpm].sort((a, b) => a.prettyName.localeCompare(b.prettyName)),
        pluginBeingUninstalled: null,
        onTransitionEnd: null
      });
    };

    this.setState({pluginBeingUninstalled: name, onTransitionEnd});

    this.plugins.uninstall(name);
  }

  openPluginsConfig = async name => {
    this.track(`plugin/config/${name}`);
    const {pluginsInstalled} = this.state;
    this.setState({category: 'plugins', tab: 'installed'});
    const index = pluginsInstalled.findIndex(p => p.name === name);
    this.setOverlay(true);

    const isValid = await this.plugins.openPluginConfig(name);

    this.setOverlay(false);
    pluginsInstalled[index].isValid = isValid;
    this.setState({pluginsInstalled});
  }

  openPluginsFolder = () => electron.shell.openItem(this.plugins.cwd);

  selectCategory = category => {
    this.setState({category});
  }

  selectTab = tab => {
    this.track(`preferences/tab/${tab}`);
    this.setState({tab});
  }

  toggleSetting = (setting, value) => {
    // TODO: Fix this ESLint violation
    // eslint-disable-next-line react/no-access-state-in-setstate
    const newVal = value === undefined ? !this.state[setting] : value;
    if (!SETTINGS_ANALYTICS_BLACKLIST.includes(setting)) {
      this.track(`preferences/setting/${setting}/${newVal}`);
    }

    this.setState({[setting]: newVal});
    this.settings.set(setting, newVal);
  }

  toggleShortcuts = async () => {
    const setting = 'recordKeyboardShortcut';
    const newVal = !this.state[setting];
    this.toggleSetting(setting, newVal);
    await this.ipc.callMain('toggle-shortcuts', {enabled: newVal});
  }

  updateShortcut = async (setting, shortcut) => {
    try {
      await this.ipc.callMain('update-shortcut', {setting, shortcut});
      this.setState({[setting]: shortcut});
    } catch (error) {
      console.warn('Error updating shortcut', error);
    }
  }

  setOpenOnStartup = value => {
    // TODO: Fix this ESLint violation
    // eslint-disable-next-line react/no-access-state-in-setstate
    const openOnStartup = typeof value === 'boolean' ? value : !this.state.openOnStartup;
    this.setState({openOnStartup});
    this.remote.app.setLoginItemSettings({openAtLogin: openOnStartup});
  }

  pickKapturesDir = () => {
    const {dialog, getCurrentWindow} = this.remote;

    const directories = dialog.showOpenDialog(getCurrentWindow(), {
      properties: [
        'openDirectory',
        'createDirectory'
      ]
    });

    if (directories) {
      this.toggleSetting('kapturesDir', directories[0]);
    }
  }

  setAudioInputDeviceId = id => {
    this.setState({audioInputDeviceId: id});
    this.settings.set('audioInputDeviceId', id);
  }
}
