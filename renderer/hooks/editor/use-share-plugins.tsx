import OptionsContainer from 'components/editor/options-container'
import {remote} from 'electron';
import {ipcRenderer} from 'electron-better-ipc';
import {useMemo} from 'react';

const useSharePlugins = () => {
  const {
    formats,
    format,
    sharePlugin,
    updateSharePlugin
  } = OptionsContainer.useContainer();

  const menuOptions = useMemo(() => {
    const selectedFormat = formats.find(f => f.format === format);

    let onlyBuiltIn = true;
    const options = selectedFormat?.plugins?.map(plugin => {
      if (plugin.apps && plugin.apps.length > 0) {
        const subMenu = plugin.apps.map(app => ({
          label: app.isDefault ? `${app.name} (default)` : app.name,
          type: 'radio',
          checked: sharePlugin.app?.url === app.url,
          value: {
            pluginName: plugin.pluginName,
            serviceTitle: plugin.title,
            app
          },
          icon: remote.nativeImage.createFromDataURL(app.icon).resize({width: 16, height: 16})
        }));

        if (plugin.apps[0].isDefault) {
          subMenu.splice(1, 0, {type: 'separator'} as any);
        }

        return {
          isBuiltIn: true,
          subMenu,
          value: {
            pluginName: plugin.pluginName,
            serviceTitle: plugin.title,
            app: plugin.apps[0]
          },
          checked: sharePlugin.pluginName === plugin.pluginName,
          label: 'Open with…'
        }
      }

      if (!plugin.pluginName.startsWith('_')) {
        onlyBuiltIn = false;
      }

      return {
        value: {
          pluginName: plugin.pluginName,
          serviceTitle: plugin.title
        },
        checked: sharePlugin.pluginName === plugin.pluginName,
        label: plugin.title
      }
    });

    if (onlyBuiltIn) {
      options?.push({
        separator: true
      } as any, {
        label: 'Get Plugins…',
        checked: false,
        click: () => {
          ipcRenderer.callMain('open-preferences', {category: 'plugins', tab: 'discover'});
        }
      } as any)
    }

    return options ?? [];
  }, [formats, format, sharePlugin]);

  const label = sharePlugin?.app ? sharePlugin.app.name : sharePlugin?.serviceTitle;

  return {menuOptions, label, onChange: updateSharePlugin};
}

export default useSharePlugins;
