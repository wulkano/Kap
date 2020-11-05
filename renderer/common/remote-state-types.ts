import {Format} from './types'

// TODO: import these from main/remote-states files when we can integrate common TS files

export type App = {
  url: string;
  isDefault: boolean;
  icon: string;
  name: string;
}

type ExportOptionsPlugin = {
  title: string;
  pluginName: string;
  pluginPath: string;
  apps?: App[];
  lastUsed: number;
}

export type ExportOptionsFormat = {
  plugins: ExportOptionsPlugin[];
  format: Format;
  prettyFormat: string;
  lastUsed: number;
}

type ExportOptionsEditService = {
  title: string;
  pluginName: string;
  pluginPath: string;
  hasConfig: boolean;
}

export type ExportOptions = {
  formats: ExportOptionsFormat[];
  editServices: ExportOptionsEditService[];
  fpsHistory: {[key in Format]: number};
}

export type EditorOptions = (sendUpdate: (state: ExportOptions) => void) => {
  actions: {
    updatePluginUsage: ({ format, plugin } : {
      format: Format;
      plugin: string;
    }) => void;
    updateFpsUsage: ({ format, fps }: {
      format: Format;
      fps: number;
    }) => void;
  };
  getState: () => ExportOptions;
}
