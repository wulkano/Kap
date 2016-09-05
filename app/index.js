const path = require('path');

const {ipcMain} = require('electron');
const menubar = require('menubar')({
  index: `file://${__dirname}/dist/index.html`,
  icon: path.join(__dirname, 'static', 'iconTemplate.png'),
  width: 250,
  height: 500,
  preloadWindow: true,
  transparent: true,
  resizable: false
});

if (process.env.DEBUG_FOCUS) {
  const electronExecutable = `${__dirname}/../node_modules/electron/dist/Electron.app/Contents/MacOS/Electron`;
  require('electron-reload')(`${__dirname}/dist`, {electron: electronExecutable}); // eslint-disable-line import/newline-after-import
  menubar.setOption('alwaysOnTop', true);
}

menubar.on('after-create-window', () => {
  if (process.env.DEBUG_FOCUS) {
    menubar.window.openDevTools({mode: 'detach'});
  }
});

ipcMain.on('set-window-size', (event, args) => {
  if (args.width && args.height && menubar.window) {
    menubar.window.setSize(args.width, args.height, true); // true == animate
  }
});
