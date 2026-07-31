import {appMenu} from 'electron-util';
import {getAboutMenuItem, getExportHistoryMenuItem, getOpenFileMenuItem, getPreferencesMenuItem, getSendFeedbackMenuItem} from './common';
import {MenuItemId, MenuOptions} from './utils';
import {t} from '../common/localization';

const getAppMenuItem = () => {
  const appMenuItem = appMenu([getPreferencesMenuItem()]);

  // @ts-expect-error
  appMenuItem.submenu[0] = getAboutMenuItem();
  return {...appMenuItem, id: MenuItemId.app};
};

// eslint-disable-next-line unicorn/prevent-abbreviations
export const defaultApplicationMenu = (): MenuOptions => [
  getAppMenuItem(),
  {
    role: 'fileMenu',
    label: t('File'),
    id: MenuItemId.file,
    submenu: [
      getOpenFileMenuItem(),
      {
        type: 'separator'
      },
      {
        role: 'close'
      }
    ]
  },
  {
    role: 'editMenu',
    label: t('Edit'),
    id: MenuItemId.edit
  },
  {
    role: 'windowMenu',
    label: t('Window'),
    id: MenuItemId.window,
    submenu: [
      {
        role: 'minimize'
      },
      {
        role: 'zoom'
      },
      {
        type: 'separator'
      },
      getExportHistoryMenuItem(),
      {
        type: 'separator'
      },
      {
        role: 'front'
      }
    ]
  },
  {
    id: MenuItemId.help,
    label: t('Help'),
    role: 'help',
    submenu: [getSendFeedbackMenuItem()]
  }
];

// eslint-disable-next-line unicorn/prevent-abbreviations
export const customApplicationMenu = (modifier: (defaultMenu: ReturnType<typeof defaultApplicationMenu>) => void) => {
  const menu = defaultApplicationMenu();
  modifier(menu);
  return menu;
};

export type MenuModifier = Parameters<typeof customApplicationMenu>[0];
