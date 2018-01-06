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

function updateContent(el, knownRatio, currentRatio) {
  currentRatio = currentRatio.join(':');
  el.querySelector('button').innerHTML = knownRatio || `Custom (${currentRatio})`;
}

function handleAppChange(app) {
  if (app.fullscreen) {
    ipcRenderer.send('open-cropper-window', {width: app.width, height: app.height}, {x: 1, y: 1});
  } else {
    ipcRenderer.send('activate-app', app.ownerName, app);
  }
}

function buildMenuItems(options, currentDimensions, windowList) {
  const {onRatioChange, el} = options;
  const [fullscreen, ...windows] = windowList;
  const knownRatio = RATIOS.find(ratio => ratio === currentDimensions.ratio.join(':'));

  updateContent(el, knownRatio, currentDimensions.ratio);

  return Menu.buildFromTemplate([
    {
      label: 'Windows',
      submenu: windows.map(win => ({
        label: win.ownerName,
        icon: win.icon,
        click: () => handleAppChange(win)
      }))
    },
    {
      label: 'Fullscreen',
      click: () => handleAppChange(fullscreen, el)
    },
    {
      type: 'separator'
    },
    ...RATIOS.map(ratio => ({
      label: ratio,
      checked: ratio === knownRatio,
      type: 'radio',
      click: () => onRatioChange(ratio)
    })),
    {
      label: 'Custom',
      enabled: false,
      type: 'radio',
      checked: !knownRatio
    }
  ]);
}

function sizeMatchesRatio(width, height, ratio) {
  const [first, second] = ratio.split(':');
  width = parseInt(width, 10);
  height = parseInt(height, 10);
  return (width / first === height / second);
}

// Helper function for retrieving the simplest ratio,
// via the largest common divisor of two numbers (thanks @doot0)
function getLargestCommonDivisor(first, second) {
  if (!first) {
    return 1;
  }

  if (!second) {
    return first;
  }

  return getLargestCommonDivisor(second, first % second);
}

function getSimplestRatio(width, height) {
  width = parseInt(width, 10);
  height = parseInt(height, 10);
  const lcd = getLargestCommonDivisor(width, height);
  const denominator = width / lcd;
  const numerator = height / lcd;
  return [denominator, numerator];
}

export function findRatioForSize(width, height) {
  const ratio = RATIOS.find(ratio => sizeMatchesRatio(width, height, ratio));
  if (ratio) {
    return ratio.split(':').map(part => parseInt(part, 10));
  }
  return getSimplestRatio(width, height);
}

export default async function buildSizeMenu(options) {
  const {emitter, el} = options;
  let {dimensions} = options;
  let windowList = await getWindowList();
  let menu = buildMenuItems(options, dimensions, windowList);

  const rebuild = () => {
    menu = buildMenuItems(options, dimensions, windowList);
  };

  emitter.on('change', newDimensions => {
    dimensions = newDimensions;
    rebuild();
  });

  ipcRenderer.on('reload-apps', async () => {
    windowList = await getWindowList();
    rebuild();
  });

  el.onclick = () => {
    menu.popup();
  };
}
