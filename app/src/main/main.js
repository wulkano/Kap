import path from 'path';

import {app, BrowserWindow, ipcMain, Menu} from 'electron';
import isDev from 'electron-is-dev';

import autoUpdater from './auto-updater';
import analytics from './analytics';
import {applicationMenu, cogMenu} from './menus';

const menubar = require('menubar')({
  index: `file://${__dirname}/index.html`,
  icon: path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'),
  width: 320,
  height: 500,
  preloadWindow: true,
  transparent: true,
  resizable: false
});

require('./reporter');

let appState = 'initial';
let cropperWindow;
let mainWindowIsDetached = false;
let mainWindow;
let positioner;
let shouldStopWhenTrayIsClicked = false;
let tray;

let recording = false;

if (isDev) {
  const electronExecutable = `${__dirname}/../../node_modules/electron/dist/Electron.app/Contents/MacOS/Electron`; // TODO send a PR
  require('electron-reload')(__dirname, {electron: electronExecutable}); // eslint-disable-line import/newline-after-import
  // menubar.setOption('alwaysOnTop', true);
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

ipcMain.on('show-options-menu', (event, coordinates) => {
  if (coordinates && coordinates.x && coordinates.y) {
    coordinates.x = parseInt(coordinates.x.toFixed(), 10);
    coordinates.y = parseInt(coordinates.y.toFixed(), 10);

    cogMenu.popup(coordinates.x + 4, coordinates.y); // 4 is the magic number ✨
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
      resizable: true,
      shadow: false
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

    cropperWindow.on('resize', () => {
      const size = {};
      [size.width, size.height] = cropperWindow.getSize();
      mainWindow.webContents.send('cropper-window-new-size', size);
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

function resetTrayIcon() {
  appState = 'initial'; // if the icon is being reseted, we are not recording anymore
  shouldStopWhenTrayIsClicked = false;
  tray.setImage(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
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
    if (expectedWindowPosition.x !== currentWindowPosition.x || expectedWindowPosition.y !== currentWindowPosition.y) { // this line is too long
      menubar.setOption('x', currentWindowPosition.x);
      menubar.setOption('y', currentWindowPosition.y);
    } else { // reset the position if the window is back at it's original position
      menubar.setOption('x', undefined);
      menubar.setOption('y', undefined);
    }
  });

  let wasStuck = true;
  mainWindow.on('move', () => { // unfortunately this is just an alias for 'moved'
    recomputeExpectedWindowPosition();
    recomputeCurrentWindowPosition();
    const diff = {
      x: Math.abs(expectedWindowPosition.x - currentWindowPosition.x),
      y: Math.abs(expectedWindowPosition.y - currentWindowPosition.y)
    };

    if (diff.y < 50 && diff.x < 50) {
      if (!wasStuck) {
        mainWindow.webContents.send('stick-to-menubar');
        app.dock.hide();
        resetMainWindowShadow();
        wasStuck = true;
        mainWindowIsDetached = false;
      }
      // the `move` event is called when the user reselases the mouse button
      // because of that, we need to move the window to it's expected position, since the
      // user will never release the mouse in the *right* position (diff.[x, y] === 0)
      tray.setHighlightMode('always');
      positioner.move('trayCenter', tray.getBounds());
    } else if (wasStuck) {
      mainWindow.webContents.send('unstick-from-menubar');
      app.dock.show();
      setTimeout(() => mainWindow.show(), 250);
      setTimeout(() => resetMainWindowShadow(), 100);
      tray.setHighlightMode('never');
      wasStuck = false;
      mainWindowIsDetached = true;
    }
  });

  tray = menubar.tray;
  positioner = menubar.positioner;

  tray.on('click', () => {
    if (appState === 'recording' && shouldStopWhenTrayIsClicked) {
      mainWindow.webContents.send('stop-recording');
    } else if (app.dock.isVisible()) {
      mainWindow.show();
    }
  });

  mainWindow.on('hide', () => {
    if (appState === 'recording') {
      tray.setImage(path.join(__dirname, '..', 'static', 'menubarStopTemplate.png'));
      shouldStopWhenTrayIsClicked = true;
    }
  });

  menubar.on('show', () => {
    if (mainWindowIsDetached) {
      tray.setHighlightMode('never');
    }
  });

  app.on('activate', () => { // == dockIcon.onclick
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  autoUpdater.init(mainWindow);
  analytics.init();
  mainWindow.once('ready-to-show', () => {
    positioner.move('trayCenter', tray.getBounds()); // not sure why the fuck this is needed (ﾉಠдಠ)ﾉ︵┻━┻
    mainWindow.show();
  });
  Menu.setApplicationMenu(applicationMenu);
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

ipcMain.on('started-recording', () => {
  appState = 'recording';
  if (!mainWindowIsDetached) {
    mainWindow.hide();
    tray.setHighlightMode('never');
  }
});

ipcMain.on('stopped-recording', () => {
  resetTrayIcon();
  analytics.track('recording/finished');
});

ipcMain.on('will-stop-recording', () => {
  recording = false;
  if (cropperWindow) {
    cropperWindow.close();
  }
});

ipcMain.on('hide-main-window', () => {
  mainWindow.hide();
});

ipcMain.on('minimize-main-window', () => {
  mainWindow.minimize();
});

ipcMain.on('move-cropper-window', (event, data) => {
  if (!data.direction || !data.amount) {
    return;
  }

  const position = cropperWindow.getPosition();
  if (data.direction === 'left') {
    position[0] -= data.amount;
  } else if(data.direction === 'up') {
    position[1] -= data.amount;
  } else if(data.direction === 'right') {
    position[0] += data.amount;
  } else if(data.direction === 'down') {
    position[1] += data.amount;
  }

  cropperWindow.setPosition(...position);
});
