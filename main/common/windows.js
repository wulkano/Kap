const {Menu, MenuItem, nativeImage} = require('electron');
const {getWindows, activateWindow} = require('mac-windows');
const {getAppIconListByPid} = require('node-mac-app-icon');
const Store = require('electron-store');

const {ignoreBlur, restoreBlur} = require('../cropper');

const APP_BLACKLIST = [
  'Kap',
  'Kap Beta'
];

const store = new Store({
  name: 'usage-history'
});

const usageHistory = store.get('appUsageHistory', {});

const isValidApp = ({ownerName}) => !APP_BLACKLIST.includes(ownerName);

const getWindowList = async () => {
  const windows = await getWindows();
  const images = await getAppIconListByPid(windows.map(win => win.pid), {
    size: 16,
    failOnError: false
  });

  let maxLastUsed = 0;

  return windows.filter(isValidApp).map(win => {
    const iconImage = images.find(img => img.pid === win.pid);
    const icon = iconImage.icon ? nativeImage.createFromBuffer(iconImage.icon) : null;

    const window = Object.assign({}, win, {
      icon2x: icon,
      icon: icon ? icon.resize({width: 16, height: 16}) : null,
      count: 0,
      lastUsed: 0
    }, usageHistory[win.pid]);

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

const buildWindowsMenu = async (onSelect, selected) => {
  const menu = new Menu();
  const windows = await getWindowList();

  windows.forEach(win => {
    menu.append(
      new MenuItem({
        label: win.ownerName,
        icon: win.icon,
        type: 'checkbox',
        checked: win.ownerName === selected,
        click: () => {
          if (onSelect) {
            onSelect(win);
          }
        }
      })
    );
  });

  return menu;
};

const updateAppUsageHistory = async app => {
  const {count = 0} = usageHistory[app.pid] || {};

  usageHistory[app.pid] = {
    count: count + 1,
    lastUsed: Date.now()
  };

  store.set('appUsageHistory', usageHistory);
};

const activateApp = async window => {
  updateAppUsageHistory(window);
  // Cropper closes onBlur by default, but activating an app means focusing it, so we have to
  // disable the onBlur behavior until the app is focused
  ignoreBlur();
  await activateWindow(window.ownerName);
  // For some reason this happened a bit too early without the timeout
  setTimeout(restoreBlur, 500);
};

module.exports = {
  buildWindowsMenu,
  activateApp
};
