import Store from 'electron-store';
import {ConversionOptions, EditorOptionsRemoteState, ExportOptions, ExportOptionsPlugin, Format, RemoteStateHandler} from '../common/types';
import {formats} from '../common/constants';

import {plugins} from '../plugins';
import {apps} from '../plugins/built-in/open-with-plugin';
import {prettifyFormat} from '../utils/formats';
import {Video} from '../video';
import {estimateGifSize} from '../utils/gif-size-estimate';

const exportUsageHistory = new Store<{[key in Format]: {lastUsed: number; plugins: Record<string, number>}}>({
  name: 'export-usage-history',
  defaults: {
    gif: {lastUsed: 6, plugins: {default: 1}},
    mp4: {lastUsed: 5, plugins: {default: 1}},
    webm: {lastUsed: 4, plugins: {default: 1}},
    hevc: {lastUsed: 3, plugins: {default: 1}},
    av1: {lastUsed: 2, plugins: {default: 1}},
    apng: {lastUsed: 1, plugins: {default: 1}}
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
    },
    hevc: {
      type: 'number',
      minimum: 0,
      default: 60
    }
  }
});

const gifSizeEstimateProcesses = new Map<string, ReturnType<typeof estimateGifSize>>();

const getEditOptions = () => {
  return plugins.editPlugins.flatMap(
    plugin => plugin.editServices
      .filter(service => plugin.config.validServices.includes(service.title))
      .map(service => ({
        title: service.title,
        pluginName: plugin.name,
        pluginPath: plugin.pluginPath,
        hasConfig: Object.keys(service.config ?? {}).length > 0
      }))
  );
};

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

const editorOptionsRemoteState: RemoteStateHandler<EditorOptionsRemoteState> = sendUpdate => {
  const state: ExportOptions = {
    formats: getExportOptions(),
    editServices: getEditOptions(),
    fpsHistory: fpsUsageHistory.store
  };

  const updatePlugins = () => {
    state.formats = getExportOptions();
    state.editServices = getEditOptions();
    sendUpdate(state);
  };

  plugins.on('installed', updatePlugins);
  plugins.on('uninstalled', updatePlugins);
  plugins.on('config-changed', updatePlugins);

  const actions = {
    updatePluginUsage: (_: string, {format, plugin}: {format: Format; plugin: string}) => {
      const usage = exportUsageHistory.get(format);
      const now = Date.now();

      usage.plugins[plugin] = now;
      usage.lastUsed = now;
      exportUsageHistory.set(format, usage);

      state.formats = getExportOptions();
      sendUpdate(state);
    },
    updateFpsUsage: (_: string, {format, fps}: {format: Format; fps: number}) => {
      fpsUsageHistory.set(format, fps);
      state.fpsHistory = fpsUsageHistory.store;
      sendUpdate(state);
    },
    estimateGifSize: async (id: string, {filePath, conversionOptions}: {
      filePath: string;
      conversionOptions: ConversionOptions;
    }) => {
      const video = Video.fromId(filePath);

      if (!video) {
        return;
      }

      gifSizeEstimateProcesses.get(id)?.cancel();

      const process = estimateGifSize(video, conversionOptions);
      gifSizeEstimateProcesses.set(id, process);

      try {
        return await process;
      } catch (error) {
        if ((error as any)?.isCanceled) {
          return;
        }

        throw error;
      } finally {
        if (gifSizeEstimateProcesses.get(id) === process) {
          gifSizeEstimateProcesses.delete(id);
        }
      }
    }
  };

  return {
    actions,
    getState: () => state
  };
};

export default editorOptionsRemoteState;
export const name = 'editor-options';
