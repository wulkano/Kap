import {nativeImage} from 'electron';
import {ipcMain} from 'electron-better-ipc';
import {Menu, MenuItemConstructorOptions, PopupOptions} from 'electron/main';
import {Except} from 'type-fest';

type TransferableMenuOption = Except<MenuItemConstructorOptions, 'click'> & {
  actionId?: number;
};

export function initializeMenus() {
  ipcMain.answerRenderer<{
    options: TransferableMenuOption[];
    popup: PopupOptions;
  }>('show-menu', async args => {
    return new Promise(resolve => {
      const mapOption = ({actionId, ...option}: TransferableMenuOption): MenuItemConstructorOptions => {
        return {
          ...option,
          click: actionId ? () => {
            resolve(actionId);
          } : undefined,
          icon: typeof option.icon === 'string' ? nativeImage.createFromDataURL(option.icon).resize({width: 16, height: 16}) : option.icon,
          submenu: Array.isArray(option.submenu) ? option.submenu.map(opt => mapOption(opt)) : option.submenu
        };
      };

      const mappedOptions = args.options.map(opt => mapOption(opt));

      const menu = Menu.buildFromTemplate(mappedOptions);

      menu.popup(args.popup);

      menu.addListener('menu-will-close', () => {
        setTimeout(() => {
          resolve(undefined);
        }, 1);
      });
    });
  });
}
