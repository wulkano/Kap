import Store from 'electron-store';
import {Format} from '../common/types';
import {formats} from '../common/constants';

import plugins from '../plugins';
import {apps, App} from '../plugins/built-in/open-with-plugin';
import {prettifyFormat} from '../utils/formats';

const exportUsageHistory = new Store<{[key in Format]: {lastUsed: number, plugins: {[key: string]: number}}}>({
  name: 'export-usage-history',
  defaults: {
    apng: {lastUsed: 1, plugins: {default: 1}},
    webm: {lastUsed: 2, plugins: {default: 1}},
    mp4: {lastUsed: 3, plugins: {default: 1}},
    gif: {lastUsed: 4, plugins: {default: 1}},
    av1: {lastUsed: 5, plugins: {default: 1}}
  }
});

const fpsUsageHistory = new Store<{[key in Format]: number}>({
  name: 'fps-usage-history',
  schema: {
    apng: {
      type: 'number',
      minimum: 0,
      default: 60
    },
    webm: {
      type: 'number',
      minimum: 0,
      default: 60
    },
    mp4: {
      type: 'number',
      minimum: 0,
      default: 60
    },
    gif: {
      type: 'number',
      minimum: 0,
      default: 60
    },
    av1: {
      type: 'number',
      minimum: 0,
      default: 60
    }
  }
});

const getEditOptions = () => {
  // console.log(plugins.getEditPlugins());
  return plugins.editPlugins.flatMap(
    plugin => plugin.editServices
      .filter(service => plugin.config.validServices.includes(service.title))
      .map(service => ({
        title: service.title,
        pluginName: plugin.name,
        pluginPath: plugin.pluginPath,
        hasConfig: Object.keys(service.config || {}).length > 0
      }))
  );
};

interface ExportOptionsPlugin {
  title: string;
  pluginName: string;
  pluginPath: string;
  apps?: App[];
  lastUsed: number;
}

const getExportOptions = () => {
  const installed = plugins.sharePlugins;

  const options = formats.map(format => ({
    format,
    prettyFormat: prettifyFormat(format),
    plugins: [] as ExportOptionsPlugin[],
    lastUsed: exportUsageHistory.get(format).lastUsed
  }));

  const sortFunc = <T extends {lastUsed: number}>(a: T, b: T) => b.lastUsed - a.lastUsed;

  for (const plugin of installed) {
    if (!plugin.isCompatible) {
      continue;
    }

    for (const service of plugin.shareServices) {
      for (const format of service.formats) {
        options.find(option => option.format === format)?.plugins.push({
          title: service.title,
          pluginName: plugin.name,
          pluginPath: plugin.pluginPath,
          apps: plugin.name === '_openWith' ? apps.get(format) : undefined,
          lastUsed: exportUsageHistory.get(format).plugins?.[plugin.name] ?? 0
        });
      }
    }
  }

  return options.map(option => ({...option, plugins: option.plugins.sort(sortFunc)})).sort(sortFunc);
};


export interface ExportOptions {
  formats: ReturnType<typeof getExportOptions>;
  editServices: ReturnType<typeof getEditOptions>;
  fpsHistory: typeof fpsUsageHistory.store
}


const editorOptionsRemoteState = (sendUpdate: (state: ExportOptions) => void) => {
  const state: ExportOptions = {
    formats: getExportOptions(),
    editServices: getEditOptions(),
    fpsHistory: fpsUsageHistory.store
  };

  const updatePlugins = () => {
    state.formats = getExportOptions();
    state.editServices = getEditOptions();
    sendUpdate(state);
  }

  plugins.on('installed', updatePlugins);
  plugins.on('uninstalled', updatePlugins);
  plugins.on('config-changed', updatePlugins);

  const actions = {
    updatePluginUsage: ({format, plugin}: {format: Format, plugin: string}) => {
      const usage = exportUsageHistory.get(format);
      const now = Date.now();

      usage.plugins[plugin] = now;
      usage.lastUsed = now;
      exportUsageHistory.set(format, usage);

      state.formats = getExportOptions();
      sendUpdate(state);
    },
    updateFpsUsage: ({format, fps}: {format: Format, fps: number}) => {
      fpsUsageHistory.set(format, fps);
      state.fpsHistory = fpsUsageHistory.store;
      sendUpdate(state);
    }
  };

  console.log(state);
  return {
    actions,
    getState: () => state
  }
};

export default editorOptionsRemoteState;
export type EditorOptions = typeof editorOptionsRemoteState;
export const name = 'editor-options';
