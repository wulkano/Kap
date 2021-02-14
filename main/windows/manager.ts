import type {BrowserWindow} from 'electron';
import {MacWindow} from '../utils/windows';
import type {Video} from '../video';
import type {DialogOptions} from './dialog';
import type {PreferencesWindowOptions} from './preferences';

export interface EditorManager {
  open: (video: Video) => Promise<void>;
  areAnyBlocking: () => boolean;
}

export interface CropperManager {
  open: () => Promise<void>;
  close: () => void;
  disable: () => void;
  setRecording: () => void;
  isOpen: () => boolean;
  selectApp: (window: MacWindow, activateWindow: (ownerName: string) => Promise<void>) => void;
}

export interface ConfigManager {
  open: (pluginName: string) => Promise<void>;
}

export interface DialogManager {
  open: (options: DialogOptions) => Promise<number | void>;
}

export interface ExportsManager {
  open: () => Promise<BrowserWindow>;
  get: () => BrowserWindow | undefined;
}

export interface PreferencesManager {
  open: (options?: PreferencesWindowOptions) => Promise<BrowserWindow>;
  close: () => void;
}

export class WindowManager {
  editor?: EditorManager;
  cropper?: CropperManager;
  config?: ConfigManager;
  dialog?: DialogManager;
  exports?: ExportsManager;
  preferences?: PreferencesManager;

  setEditor = (editorManager: EditorManager) => {
    this.editor = editorManager;
  };

  setCropper = (cropperManager: CropperManager) => {
    this.cropper = cropperManager;
  };

  setConfig = (configManager: ConfigManager) => {
    this.config = configManager;
  };

  setDialog = (dialogManager: DialogManager) => {
    this.dialog = dialogManager;
  };

  setExports = (exportsManager: ExportsManager) => {
    this.exports = exportsManager;
  };

  setPreferences = (preferencesManager: PreferencesManager) => {
    this.preferences = preferencesManager;
  };
}

export const windowManager = new WindowManager();
