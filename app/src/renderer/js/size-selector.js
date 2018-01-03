import {remote} from 'electron';
import {getWindows} from 'mac-windows';
import {getAppIconListByPid} from 'node-mac-app-icon';

const {Menu, nativeImage} = remote;

const RATIOS = [
  '16:9',
  '5:4',
  '5:3',
  '4:3',
  '3:2',
  '1:1',
  'Custom'
];
const DEFAULT_RATIO = '1:1';

async function getWindowList() {
  const windows = await getWindows();
  const images = await getAppIconListByPid(windows.map(win => win.pid), {
    size: 16,
    encoding: 'buffer'
  });
  return windows
    .filter(win => win.ownerName !== 'Kap')
    .map(win => Object.assign({}, win, {
      icon: nativeImage
        .createFromBuffer(images.find(img => img.pid === win.pid).icon)
        .resize({
          width: 16,
          height: 16
        })
    }));
}

function handleClick(menuItem, el) {
  el.innerHTML = menuItem.label;
}

export default async function buildSizeMenu(el, handleRatioChange) {
  const windows = await getWindowList();
  console.log(windows);

  const menu = Menu.buildFromTemplate([
    ...RATIOS.map(ratio => ({
      label: ratio,
      checked: ratio === DEFAULT_RATIO,
      type: 'radio',
      click: menuItem => {
        handleRatioChange(menuItem.label);
        handleClick(menuItem, el);
      }
    })),
    {
      type: 'separator'
    },
    {
      label: 'Windows',
      submenu: [
        {
          label: 'Fullscreen'
        },
        {
          type: 'separator'
        },
        ...windows.map(win => ({
          label: win.ownerName,
          icon: win.icon,
          click: menuItem => handleClick(menuItem, el)
        }))
      ]
    }
  ]);

  el.onclick = () => {
    menu.popup();
  };
}
