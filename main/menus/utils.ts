import {Menu} from 'electron';

export type MenuOptions = Parameters<typeof Menu.buildFromTemplate>[0];

export enum MenuItemId {
  exportHistory = 'exportHistory',
  sendFeedback = 'sendFeedback',
  openVideo = 'openVideo',
  about = 'about',
  preferences = 'preferences',
  file = 'file',
  edit = 'edit',
  window = 'window',
  help = 'help',
  app = 'app',
  saveOriginal = 'saveOriginal',
  plugins = 'plugins',
  audioDevices = 'audioDevices'
}

export const getCurrentMenuItem = (id: MenuItemId) => {
  return Menu.getApplicationMenu()?.getMenuItemById(id);
};

export const setExportMenuItemState = (enabled: boolean) => {
  const menuItem = Menu.getApplicationMenu()?.getMenuItemById(MenuItemId.exportHistory);

  if (menuItem) {
    menuItem.enabled = enabled;
  }
};
