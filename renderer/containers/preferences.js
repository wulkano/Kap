import electron from 'electron';
import {Container} from 'unstated';
import {ipcRenderer as ipc} from 'electron-better-ipc';
// Import {defaultInputDeviceId} from 'common/constants';

const defaultInputDeviceId = 'asd';

const SETTINGS_ANALYTICS_BLACKLIST = ['kapturesDir'];

export default class PreferencesContainer extends Container {
  remote = electron.remote || false;

  state = {
    category: 'general',
    tab: 'discover',
    isMounted: false
  };

  mount = async setOverlay => {
    this.setOverlay = setOverlay;
    const {settings, shortcuts} = this.remote.require('./common/settings');
    this.settings = settings;
    this.settings.shortcuts = shortcuts;
    this.systemPermissions = this.remote.require('./common/system-permissions');
    this.plugins = this.remote.require('./plugins').plugins;
    this.track = this.remote.require('./common/analytics').track;
    this.showError = this.remote.require('./utils/errors').showError;

    const pluginsInstalled = this.plugins.installedPlugins.sort((a, b) => a.prettyName.localeCompare(b.prettyName));

    this.fetchFromNpm();

    this.setState({
      shortcuts: {},
      ...this.settings.store,
      openOnStartup: this.remote.app.getLoginItemSettings().openAtLogin,
      pluginsInstalled,
      isMounted: true,
      shortcutMap: this.settings.shortcuts
    });

    if (this.settings.store.recordAudio) {
      this.getAudioDevices();
    }
  };

  getAudioDevices = async () => {
    const {getAudioDevices, getDefaultInputDevice} = this.remote.require('./utils/devices');
    const {audioInputDeviceId} = this.settings.store;
    const {name: currentDefaultName} = getDefaultInputDevice() || {};

    const audioDevices = await getAudioDevices();
    const updates = {
      audioDevices: [
        {name: `System Default${currentDefaultName ? ` (${currentDefaultName})` : ''}`, id: defaultInputDeviceId},
        ...audioDevices
      ],
      audioInputDeviceId
    };

    if (!audioDevices.some(device => device.id === audioInputDeviceId)) {
      updates.audioInputDeviceId = defaultInputDeviceId;
      this.settings.set('audioInputDeviceId', defaultInputDeviceId);
    }

    this.setState(updates);
  };

  scrollIntoView = (tabId, pluginId) => {
    const plugin = document.querySelector(`#${tabId} #${pluginId}`).parentElement;
    plugin.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
  };

  openTarget = target => {
    const isInstalled = this.state.pluginsInstalled.some(plugin => plugin.name === target.name);
    const isFromNpm = this.state.pluginsFromNpm && this.state.pluginsFromNpm.some(plugin => plugin.name === target.name);

    if (target.action === 'install') {
      if (isInstalled) {
        this.scrollIntoView(this.state.tab, target.name);
        this.setState({category: 'plugins'});
      } else if (isFromNpm) {
        this.scrollIntoView('discover', target.name);
        this.setState({category: 'plugins', tab: 'discover'});

        const buttonIndex = this.remote.dialog.showMessageBoxSync(this.remote.getCurrentWindow(), {
          type: 'question',
          buttons: [
            'Install',
            'Cancel'
          ],
          defaultId: 0,
          cancelId: 1,
          message: `Do you want to install the “${target.name}” plugin?`
        });

        if (buttonIndex === 0) {
          this.install(target.name);
        }
      } else {
        this.setState({category: 'plugins'});
      }
    } else if (target.action === 'configure' && isInstalled) {
      this.openPluginsConfig(target.name);
    } else {
      this.setState({category: 'plugins'});
    }
  };

  setNavigation = ({category, tab, target}) => {
    if (target) {
      if (this.state.isMounted) {
        this.openTarget(target);
      } else {
        this.setState({target});
      }
    } else {
      this.setState({category, tab});
    }
  };

  fetchFromNpm = async () => {
    try {
      const plugins = await this.plugins.getFromNpm();
      this.setState({
        npmError: false,
        pluginsFromNpm: plugins.sort((a, b) => {
          if (a.isCompatible !== b.isCompatible) {
            return b.isCompatible - a.isCompatible;
          }

          return a.prettyName.localeCompare(b.prettyName);
        })
      });

      if (this.state.target) {
        this.openTarget(this.state.target);
        this.setState({target: undefined});
      }
    } catch {
      this.setState({npmError: true});
    }
  };

  togglePlugin = plugin => {
    if (plugin.isInstalled) {
      this.uninstall(plugin.name);
    } else {
      this.install(plugin.name);
    }
  };

  install = async name => {
    const {pluginsInstalled, pluginsFromNpm} = this.state;

    this.setState({pluginBeingInstalled: name});
    const result = await this.plugins.install(name);

    if (result) {
      this.setState({
        pluginBeingInstalled: undefined,
        pluginsFromNpm: pluginsFromNpm.filter(p => p.name !== name),
        pluginsInstalled: [result, ...pluginsInstalled].sort((a, b) => a.prettyName.localeCompare(b.prettyName))
      });
    } else {
      this.setState({
        pluginBeingInstalled: undefined
      });
    }
  };

  uninstall = async name => {
    const {pluginsInstalled, pluginsFromNpm} = this.state;

    const onTransitionEnd = async () => {
      const plugin = await this.plugins.uninstall(name);
      this.setState({
        pluginsInstalled: pluginsInstalled.filter(p => p.name !== name),
        pluginsFromNpm: [plugin, ...pluginsFromNpm].sort((a, b) => a.prettyName.localeCompare(b.prettyName)),
        pluginBeingUninstalled: null,
        onTransitionEnd: null
      });
    };

    this.setState({pluginBeingUninstalled: name, onTransitionEnd});
  };

  openPluginsConfig = async name => {
    this.track(`plugin/config/${name}`);
    this.scrollIntoView('installed', name);
    this.setState({category: 'plugins'});
    this.setOverlay(true);
    await this.plugins.openPluginConfig(name);
    ipc.callMain('refresh-usage');
    this.setOverlay(false);
  };

  openPluginsFolder = () => electron.shell.openPath(this.plugins.pluginsDir);

  selectCategory = category => {
    this.setState({category});
  };

  selectTab = tab => {
    this.track(`preferences/tab/${tab}`);
    this.setState({tab});
  };

  toggleSetting = (setting, value) => {
    const newValue = value === undefined ? !this.state[setting] : value;
    if (!SETTINGS_ANALYTICS_BLACKLIST.includes(setting)) {
      this.track(`preferences/setting/${setting}/${newValue}`);
    }

    this.setState({[setting]: newValue});
    this.settings.set(setting, newValue);
  };

  toggleRecordAudio = async () => {
    const newValue = !this.state.recordAudio;
    this.track(`preferences/setting/recordAudio/${newValue}`);

    if (!newValue || await this.systemPermissions.ensureMicrophonePermissions()) {
      if (newValue) {
        try {
          await this.getAudioDevices();
        } catch (error) {
          this.showError(error);
        }
      }

      this.setState({recordAudio: newValue});
      this.settings.set('recordAudio', newValue);
    }
  };

  toggleShortcuts = async () => {
    const setting = 'enableShortcuts';
    const newValue = !this.state[setting];
    this.toggleSetting(setting, newValue);
    await ipc.callMain('toggle-shortcuts', {enabled: newValue});
  };

  updateShortcut = async (setting, shortcut) => {
    try {
      await ipc.callMain('update-shortcut', {setting, shortcut});
      this.setState({
        shortcuts: {
          ...this.state.shortcuts,
          [setting]: shortcut
        }
      });
    } catch (error) {
      console.warn('Error updating shortcut', error);
    }
  };

  setOpenOnStartup = value => {
    const openOnStartup = typeof value === 'boolean' ? value : !this.state.openOnStartup;
    this.setState({openOnStartup});
    this.remote.app.setLoginItemSettings({openAtLogin: openOnStartup});
  };

  pickKapturesDir = () => {
    const {dialog, getCurrentWindow} = this.remote;

    const directories = dialog.showOpenDialogSync(getCurrentWindow(), {
      properties: [
        'openDirectory',
        'createDirectory'
      ]
    });

    if (directories) {
      this.toggleSetting('kapturesDir', directories[0]);
    }
  };

  setAudioInputDeviceId = id => {
    this.setState({audioInputDeviceId: id});
    this.settings.set('audioInputDeviceId', id);
  };
}
