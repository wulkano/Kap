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

function handleRatioChange(ratio, el, onRatioChange) {
  onRatioChange(ratio);
  el.querySelector('.selector-content').innerHTML = ratio;
}

function handleAppChange(app) {
  if (app.fullscreen) {
    ipcRenderer.send('open-cropper-window', {width: app.width, height: app.height}, {x: 1, y: 1});
  } else {
    ipcRenderer.send('activate-application', app.ownerName, app);
  }
}

export default async function buildSizeMenu(el, onRatioChange, emitter) {
  const [fullscreen, ...windows] = await getWindowList();
  console.log(windows);
  console.log(emitter);
  emitter.on('change', e => {
    console.log('Change', e);
  });

  const menu = Menu.buildFromTemplate([
    ...RATIOS.map(ratio => ({
      label: ratio,
      checked: ratio === DEFAULT_RATIO,
      type: 'radio',
      click: () => handleRatioChange(ratio, el, onRatioChange)
    })),
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

  el.onclick = () => {
    menu.popup();
  };
}
