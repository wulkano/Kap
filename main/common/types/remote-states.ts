import {App, Format} from './base';
import {ConversionStatus} from './conversion-options';

export interface ExportOptionsPlugin {
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
};

export type ExportOptionsEditService = {
  title: string;
  pluginName: string;
  pluginPath: string;
  hasConfig: boolean;
};

export type ExportOptions = {
  formats: ExportOptionsFormat[];
  editServices: ExportOptionsEditService[];
  fpsHistory: {[key in Format]: number};
};

export type EditorOptionsRemoteState = (sendUpdate: (state: ExportOptions) => void) => {
  actions: {
    updatePluginUsage: ({format, plugin}: {
      format: Format;
      plugin: string;
    }) => void;
    updateFpsUsage: ({format, fps}: {
      format: Format;
      fps: number;
    }) => void;
  };
  getState: () => ExportOptions;
};

export interface ConversionState {
  title: string;
  description: string;
  message: string;
  progress?: number;
  size?: string;
  status: ConversionStatus;
  canCopy: boolean;
}

export type ConversionRemoteState = (sendUpdate: (state: ConversionState, id: string) => void) => {
  actions: {
    copy: (_?: undefined, conversionId?: string) => void;
    cancel: (_?: undefined, conversionId?: string) => void;
  };
  getState: (conversionId: string) => ConversionState | undefined;
};
