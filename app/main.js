const path = require('path');

const electron = require('electron');

const {BrowserWindow, ipcMain, Menu} = electron;
const isDev = require('electron-is-dev');
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

require('./error-report');

let mainWindow;
let cropperWindow;
let tray;
let positioner;

let recording = false;

if (isDev) {
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

    if (isDev) {
      cropperWindow.openDevTools({mode: 'detach'});
      cropperWindow.webContents.on('devtools-opened', () => {
        setCropperWindowOnBlur();
      });
    } else {
      setCropperWindowOnBlur();
    }

    cropperWindow.on('closed', () => {
      cropperWindow = undefined;
      mainWindow.webContents.send('cropper-window-closed');
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

function resetMainWindowShadow() {
  const size = mainWindow.getSize();
  setTimeout(() => {
    size[1]++;
    mainWindow.setSize(...size, true);
  }, 100);
  setTimeout(() => {
    size[1]--;
    mainWindow.setSize(...size, true);
  }, 110);
}

menubar.on('after-create-window', () => {
  let expectedWindowPosition;
  const currentWindowPosition = {};
  mainWindow = menubar.window;
  if (isDev) {
    mainWindow.openDevTools({mode: 'detach'});
  }

  function recomputeExpectedWindowPosition() {
    expectedWindowPosition = positioner.calculate('trayCenter', tray.getBounds());
  }

  function recomputeCurrentWindowPosition() {
    [currentWindowPosition.x, currentWindowPosition.y] = mainWindow.getPosition();
  }

  mainWindow.on('blur', () => {
    if (cropperWindow && !cropperWindow.isFocused() && !recording) {
      // close the cropper window if the main window loses focus and the cropper window
      // is not focused
      cropperWindow.close();
    }

    recomputeExpectedWindowPosition();
    recomputeCurrentWindowPosition();
    if (expectedWindowPosition.x !== currentWindowPosition.x|| expectedWindowPosition.y !== currentWindowPosition.y) { // this line is too long
      menubar.setOption('x', currentWindowPosition.x);
      menubar.setOption('y', currentWindowPosition.y);
    } else { // reset the position if the window is back at it's original position
      menubar.setOption('x', undefined);
      menubar.setOption('y', undefined);
    }
  });

  let wasAutoMoved = false;
  mainWindow.on('move', () => { // unfortunately this is just an alias for 'moved'
    recomputeExpectedWindowPosition();
    recomputeCurrentWindowPosition();
    const diff = {
      x: Math.abs(expectedWindowPosition.x - currentWindowPosition.x),
      y: Math.abs(expectedWindowPosition.y - currentWindowPosition.y)
    };

    if (diff.y < 50 && diff.x < 50) {
      mainWindow.webContents.send('stick-to-menubar');
      resetMainWindowShadow();
      positioner.move('trayCenter', tray.getBounds());
    } else {
      mainWindow.webContents.send('unstick-from-menubar');
      resetMainWindowShadow();
    }
  });

  tray = menubar.tray;
  positioner = menubar.positioner;
});

ipcMain.on('get-cropper-bounds', event => {
  if (cropperWindow) {
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

ipcMain.on('hide-main-window', () => {
  mainWindow.hide();
  menubar.setOption('x', undefined);
  menubar.setOption('y', undefined);
  // TODO: maybe enable offscreen rendering so the traffic lights can disappear
});
