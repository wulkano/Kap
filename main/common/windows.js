const {Menu, MenuItem, nativeImage} = require('electron');
const {getWindows, activateWindow: activate} = require('mac-windows');
const {getAppIconListByPid} = require('node-mac-app-icon');
// const Store = require('electron-store');

const {ignoreBlur, restoreBlur} = require('../cropper');

const APP_BLACKLIST = [
  'Kap',
  'Kap Beta'
];

// const store = new Store({
//   name: 'usage-history'
// });
//
// const usageHistory = store.get('appUsageHistory', {});

const isValidApp = ({ownerName}) => !APP_BLACKLIST.includes(ownerName);

const getWindowList = async () => {
  const windows = await getWindows();
  const images = await getAppIconListByPid(windows.map(win => win.pid), {
    size: 16,
    failOnError: false
  });

  return windows.filter(isValidApp).map(win => {
    const iconImage = images.find(img => img.pid === win.pid);
    const icon = iconImage.icon ? nativeImage.createFromBuffer(iconImage.icon) : null;

    return Object.assign({}, win, {
      icon2x: icon,
      icon: icon ? icon.resize({width: 16, height: 16}) : null
    });
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

const activateWindow = async window => {
  ignoreBlur();
  console.log('Calling activate with ', window.ownerName);
  await activate(window.ownerName);
  setTimeout(restoreBlur, 500);
};

module.exports = {
  buildWindowsMenu,
  activateWindow
};
