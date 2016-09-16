const path = require('path');

const electron = require('electron');

const {BrowserWindow, ipcMain, Menu} = electron;
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

let cropperWindow;

ipcMain.on('open-cropper-window', () => {
  menubar.window.setAlwaysOnTop(true); // TODO send a PR to `menubar`
  menubar.setOption('alwaysOnTop', true);
  if (!cropperWindow) {
    const {workAreaSize} = electron.screen.getPrimaryDisplay();
    cropperWindow = new BrowserWindow({
      width: workAreaSize.width,
      height: workAreaSize.height,
      frame: false,
      transparent: true,
      resizable: false
    });
    cropperWindow.loadURL(`file://${__dirname}/dist/cropper.html`);
    cropperWindow.setIgnoreMouseEvents(false); // TODO this should be false by default

    if (process.env.DEBUG_FOCUS) {
      cropperWindow.openDevTools({mode: 'detach'});
    }

    cropperWindow.on('closed', () => {
      cropperWindow = undefined;
    });
  }
});

ipcMain.on('close-cropper-window', () => {
  if (cropperWindow) {
    menubar.window.setAlwaysOnTop(false); // TODO send a PR to `menubar`
    menubar.setOption('alwaysOnTop', false);
    cropperWindow.close(); // TODO: cropperWindow.hide()
  }
});

menubar.on('after-create-window', () => {
  if (process.env.DEBUG_FOCUS) {
    menubar.window.openDevTools({mode: 'detach'});
  }

  menubar.window.on('blur', () => {
    if (cropperWindow && !cropperWindow.isFocused()) {
      // close the cropper window if the main window loses focus and the cropper window
      // is not focused
      cropperWindow.close();
    }
  });
});
