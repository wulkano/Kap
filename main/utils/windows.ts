import {Menu, MenuItem, nativeImage} from 'electron';
import Store from 'electron-store';
import {windowManager} from '../windows/manager';

const {getWindows, activateWindow} = require('mac-windows');
const {getAppIconListByPid} = require('node-mac-app-icon');

export interface MacWindow {
  pid: number;
  ownerName: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  number: number;
}

const APP_BLACKLIST = [
  'Kap',
  'Kap Beta'
];

const store = new Store<{
  appUsageHistory: Record<number, {
    count: number;
    lastUsed: number;
  } | undefined>;
}>({
  name: 'usage-history'
});

const usageHistory = store.get('appUsageHistory', {});

const isValidApp = ({ownerName}: MacWindow) => !APP_BLACKLIST.includes(ownerName);

const getWindowList = async () => {
  const windows = await getWindows() as MacWindow[];
  const images = await getAppIconListByPid(windows.map(win => win.pid), {
    size: 16,
    failOnError: false
  }) as Array<{
    pid: number;
    icon: Buffer;
  }>;

  let maxLastUsed = 0;

  return windows.filter(window => isValidApp(window)).map(win => {
    const iconImage = images.find(img => img.pid === win.pid);
    const icon = iconImage?.icon ? nativeImage.createFromBuffer(iconImage.icon) : undefined;

    const window = {
      ...win,
      icon2x: icon,
      icon: icon?.resize({width: 16, height: 16}),
      count: 0,
      lastUsed: 0,
      ...usageHistory[win.pid]
    };

    maxLastUsed = Math.max(maxLastUsed, window.lastUsed);
    return window;
  }).sort((a, b) => {
    if (a.lastUsed === maxLastUsed) {
      return -1;
    }

    if (b.lastUsed === maxLastUsed) {
      return 1;
    }

    return b.count - a.count;
  });
};

export const buildWindowsMenu = async (selected: string) => {
  const menu = new Menu();
  const windows = await getWindowList();

  for (const win of windows) {
    menu.append(
      new MenuItem({
        label: win.ownerName,
        icon: win.icon,
        type: 'checkbox',
        checked: win.ownerName === selected,
        click: () => {
          activateApp(win);
        }
      })
    );
  }

  return menu;
};

const updateAppUsageHistory = (app: MacWindow) => {
  const {count = 0} = usageHistory[app.pid] ?? {};

  usageHistory[app.pid] = {
    count: count + 1,
    lastUsed: Date.now()
  };

  store.set('appUsageHistory', usageHistory);
};

export const activateApp = (window: MacWindow) => {
  updateAppUsageHistory(window);
  windowManager.cropper?.selectApp(window, activateWindow);
};
