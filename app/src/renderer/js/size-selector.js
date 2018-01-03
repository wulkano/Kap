import {remote, ipcRenderer} from 'electron';
import {getWindows} from 'mac-windows';
import {getAppIconListByPid} from 'node-mac-app-icon';

const {Menu, nativeImage} = remote;

const RATIOS = [
  '16:9',
  '5:4',
  '5:3',
  '4:3',
  '3:2',
  '1:1'
];

async function getWindowList() {
  const windows = await getWindows();
  const images = await getAppIconListByPid(windows.map(win => win.pid), {
    size: 16,
    encoding: 'buffer'
  });
  const {width, height} = remote.screen.getPrimaryDisplay().bounds;

  return [
    {
      ownerName: 'Fullscreen',
      fullscreen: true,
      width,
      height
    },
    ...windows
      .filter(win => win.ownerName !== 'Kap')
      .map(win => Object.assign({}, win, {
        icon: nativeImage
          .createFromBuffer(images.find(img => img.pid === win.pid).icon)
          .resize({
            width: 16,
            height: 16
          })
      }))
  ];
}

function updateContent(el, ratio) {
  el.querySelector('.selector-content').innerHTML = ratio || 'Custom';
}

function handleAppChange(app) {
  if (app.fullscreen) {
    ipcRenderer.send('open-cropper-window', {width: app.width, height: app.height}, {x: 1, y: 1});
  } else {
    ipcRenderer.send('activate-application', app.ownerName, app);
  }
}

function sizeMatchesRatio(size, ratio) {
  const [first, second] = ratio.split(':');
  const {width, height} = size;
  return (width / first === height / second);
}

function buildMenuItems(options, currentDimensions, windowList) {
  const {onRatioChange, el} = options;
  const [fullscreen, ...windows] = windowList;

  const currentRatio = RATIOS.find(ratio => sizeMatchesRatio(currentDimensions, ratio));

  updateContent(el, currentRatio);

  return Menu.buildFromTemplate([
    ...RATIOS.map(ratio => ({
      label: ratio,
      checked: ratio === currentRatio,
      type: 'radio',
      click: () => {
        onRatioChange(ratio);
        updateContent(el, ratio);
      }
    })),
    {
      label: 'Custom',
      checked: !currentRatio,
      type: 'radio'
    },
    {
      type: 'separator'
    },
    {
      label: 'Windows',
      submenu: [
        {
          label: 'Fullscreen',
          click: () => handleAppChange(fullscreen, el)
        },
        {
          type: 'separator'
        },
        ...windows.map(win => ({
          label: win.ownerName,
          icon: win.icon,
          click: () => handleAppChange(win)
        }))
      ]
    }
  ]);
}

export default async function buildSizeMenu(options) {
  const {emitter, dimensions, el} = options;
  const windowList = await getWindowList();

  let menu = buildMenuItems(options, dimensions, windowList);
  emitter.on('change', newDimensions => {
    menu = buildMenuItems(options, newDimensions, windowList);
  });

  el.onclick = () => {
    menu.popup();
  };
}
