const path = require('path');

const {ipcMain, Menu} = require('electron');
const menubar = require('menubar')({
  index: `file://${__dirname}/dist/index.html`,
  icon: path.join(__dirname, 'static', 'iconTemplate.png'),
  width: 250,
  height: 500,
  preloadWindow: true,
  transparent: true,
  resizable: false
});
const opn = require('opn');

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

const optionsMenu = Menu.buildFromTemplate([
  {
    label: 'About',
    click: () => opn('http://wulka.no', {wait: false})
  },
  {
    type: 'separator'
  },
  {
    label: 'Quit',
    accelerator: 'Cmd+Q', // TODO change this when support for win/linux is added
    click: () => menubar.app.quit()
  }
]);

ipcMain.on('show-options-menu', (event, coordinates) => {
  if (coordinates && coordinates.x && coordinates.y) {
    coordinates.x = parseInt(coordinates.x.toFixed(), 10);
    coordinates.y = parseInt(coordinates.y.toFixed(), 10);

    optionsMenu.popup(coordinates.x + 4, coordinates.y); // 4 is the magic number ✨
  }
});
