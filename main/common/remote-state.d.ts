import {string, number} from 'prop-types';

export type FormatName = 'gif' | 'av1' | 'mp4' | 'webm' | 'apng';

export interface App {
  isDefault: boolean;
  icon: string;
  url: string;
  name: string;
}

export interface Plugin {
  title: string;
  pluginName: string;
  pluginPath: string;
  apps?: App[];
  lastUsed: number
}

export interface Format {
  format: FormatName;
  prettyFormat: string;
  plugins: Plugin[]
  lastUsed: number;
};

export interface EditService {
  title: string;
  pluginName: string;
  pluginPath: string;
  hasConfig: boolean;
}

export interface EditorOptionsState {
  formats: Format[];
  editServices: EditService[];
  fpsHistory: {
    [key: FormatName]: number;
  }
}

export interface EditorOptionsActions {
  updatePluginState: (args: {format: FormatName, plugin: string}) => void;
  updateFpsUsage: (args: {format: FormatName, fps: number}) => void;
}

export type UseRemoteStateFunction<Name, State, Actions = {}> = (name: Name, initialState?: State) => () => Actions & {state: State, isLoading: boolean};

export const useRemoteState: UseRemoteStateFunction<'editor-options', EditorOptionsState, EditorOptionsActions>;

