const path = require('path');

const electron = require('electron');

const {BrowserWindow, ipcMain, Menu} = electron;
const menubar = require('menubar')({
  index: `file://${__dirname}/index.html`,
  icon: path.join(__dirname, '..', 'static', 'iconTemplate.png'),
  width: 320,
  height: 500,
  preloadWindow: true,
  transparent: true,
  resizable: false
});
const opn = require('opn');

let mainWindow;
let cropperWindow;

let recording = false;

if (process.env.DEBUG_FOCUS) {
  const electronExecutable = `${__dirname}/../../node_modules/electron/dist/Electron.app/Contents/MacOS/Electron`; // TODO send a PR
  require('electron-reload')(__dirname, {electron: electronExecutable}); // eslint-disable-line import/newline-after-import
  menubar.setOption('alwaysOnTop', true);
}

ipcMain.on('set-main-window-size', (event, args) => {
  if (args.width && args.height && mainWindow) {
    [args.width, args.height] = [parseInt(args.width, 10), parseInt(args.height, 10)];
    mainWindow.setSize(args.width, args.height, true); // true == animate
  }
});

ipcMain.on('set-cropper-window-size', (event, args) => {
  if (args.width && args.height && cropperWindow) {
    [args.width, args.height] = [parseInt(args.width, 10), parseInt(args.height, 10)];
    cropperWindow.setSize(args.width, args.height, true); // true == animate
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

function setCropperWindowOnBlur() {
  cropperWindow.on('blur', () => {
    if (!mainWindow.isFocused() &&
        !cropperWindow.webContents.isDevToolsFocused() &&
        !mainWindow.webContents.isDevToolsFocused() &&
        !recording) {
      cropperWindow.close();
    }
  });
}

ipcMain.on('open-cropper-window', (event, size) => {
  mainWindow.setAlwaysOnTop(true); // TODO send a PR to `menubar`
  menubar.setOption('alwaysOnTop', true);
  if (cropperWindow) {
    cropperWindow.focus();
  } else {
    cropperWindow = new BrowserWindow({
      width: size.width,
      height: size.height,
      frame: false,
      transparent: true,
      resizable: true
    });
    cropperWindow.loadURL(`file://${__dirname}/cropper.html`);
    cropperWindow.setIgnoreMouseEvents(false); // TODO this should be false by default

    if (process.env.DEBUG_FOCUS) {
      cropperWindow.openDevTools({mode: 'detach'});
      cropperWindow.webContents.on('devtools-opened', () => {
        setCropperWindowOnBlur();
      });
    } else {
      setCropperWindowOnBlur();
    }

    cropperWindow.on('closed', () => {
      cropperWindow = undefined;
    });
  }
});

ipcMain.on('close-cropper-window', () => {
  if (cropperWindow && !recording) {
    mainWindow.setAlwaysOnTop(false); // TODO send a PR to `menubar`
    menubar.setOption('alwaysOnTop', false);
    cropperWindow.close(); // TODO: cropperWindow.hide()
  }
});

menubar.on('after-create-window', () => {
  mainWindow = menubar.window;
  if (process.env.DEBUG_FOCUS) {
    mainWindow.openDevTools({mode: 'detach'});
  }

  mainWindow.on('blur', () => {
    if (cropperWindow && !cropperWindow.isFocused() && !recording) {
      // close the cropper window if the main window loses focus and the cropper window
      // is not focused
      cropperWindow.close();
    }
  });
});

ipcMain.on('get-cropper-bounds', event => {
  if (cropperWindow) {
    console.log('event', cropperWindow.getContentBounds());
    event.returnValue = cropperWindow.getContentBounds();
  }
});

ipcMain.on('is-cropper-active', event => {
  event.returnValue = Boolean(cropperWindow);
});

ipcMain.on('will-start-recording', () => {
  recording = true;
  if (cropperWindow) {
    cropperWindow.setResizable(false);
    cropperWindow.setIgnoreMouseEvents(true);
    cropperWindow.setAlwaysOnTop(true);
  }
});

ipcMain.on('will-stop-recording', () => {
  recording = false;
  if (cropperWindow) {
    cropperWindow.close();
  }
});
