import {homedir} from 'os';
import path from 'path';
import {rename as fsRename} from 'fs';

import {app, dialog, BrowserWindow, ipcMain, Menu} from 'electron';
import settings from 'electron-settings';
import isDev from 'electron-is-dev';
import mkdirp from 'mkdirp';

import {init as initErrorReporter} from '../common/reporter';
import logger from '../common/logger';

// import autoUpdater from './auto-updater';
import analytics from './analytics';
import {applicationMenu, cogMenu} from './menus';

const menubar = require('menubar')({
  index: `file://${__dirname}/../renderer/html/index.html`,
  icon: path.join(__dirname, '..', '..', 'static', 'menubarDefaultTemplate.png'),
  width: 320,
  height: 500,
  preloadWindow: true,
  transparent: true,
  resizable: false,
  minWidth: 320
});

let appState = 'initial';
let cropperWindow;
const cropperWindowBuffer = 4;
let mainWindowIsDetached = false;
let mainWindow;
let mainWindowIsNew = true;
let positioner;
let postRecWindow;
let shouldStopWhenTrayIsClicked = false;
let tray;

let recording = false;

ipcMain.on('set-main-window-size', (event, args) => {
  if (args.width && args.height && mainWindow) {
    [args.width, args.height] = [parseInt(args.width, 10), parseInt(args.height, 10)];
    mainWindow.setSize(args.width, args.height, true); // true == animate
  }
});

ipcMain.on('set-cropper-window-size', (event, args) => {
  if (args.width && args.height && cropperWindow) {
    [args.width, args.height] = [parseInt(args.width, 10), parseInt(args.height, 10)];
    cropperWindow.setSize(args.width + cropperWindowBuffer, args.height + cropperWindowBuffer, true); // true == animate
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
      width: size.width + cropperWindowBuffer,
      height: size.height + cropperWindowBuffer,
      frame: false,
      transparent: true,
      resizable: true,
      shadow: false
    });
    cropperWindow.loadURL(`file://${__dirname}/../renderer/html/cropper.html`);
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
  tray.setImage(path.join(__dirname, '..', '..', 'static', 'menubarDefaultTemplate.png'));
  menubar.setOption('alwaysOnTop', false);
  mainWindow.setAlwaysOnTop(false);
}

menubar.on('after-create-window', () => {
  let expectedWindowPosition;
  const currentWindowPosition = {};
  mainWindow = menubar.window;
  app.mainWindow = mainWindow;
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
    if (postRecWindow) {
      return postRecWindow.show();
    }
    if (mainWindowIsNew) {
      mainWindowIsNew = false;
      positioner.move('trayCenter', tray.getBounds()); // not sure why the fuck this is needed (ﾉಠдಠ)ﾉ︵┻━┻
    }
    if (appState === 'recording' && shouldStopWhenTrayIsClicked) {
      mainWindow.webContents.send('stop-recording');
    } else if (app.dock.isVisible()) {
      mainWindow.show();
    }
  });

  mainWindow.on('hide', () => {
    if (appState === 'recording') {
      tray.setImage(path.join(__dirname, '..', '..', 'static', 'menubarStopTemplate.png'));
      shouldStopWhenTrayIsClicked = true;
    }
  });

  menubar.on('show', () => {
    if (mainWindowIsDetached) {
      tray.setHighlightMode('never');
    }
  });

  app.on('activate', () => { // == dockIcon.onclick
    if (!mainWindow.isVisible() && postRecWindow === undefined) {
      mainWindow.show();
    }
  });

  mainWindow.once('ready-to-show', () => {
    positioner.move('trayCenter', tray.getBounds()); // not sure why the fuck this is needed (ﾉಠдಠ)ﾉ︵┻━┻
    mainWindow.show();
  });

  mainWindowIsNew = true;
  // autoUpdater.init(mainWindow);
  analytics.init();
  initErrorReporter();
  logger.init(mainWindow);
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
  const amount = data.amount;

  switch (data.direction) {
    case 'left':
      position[0] -= amount;
      break;
    case 'up':
      position[1] -= amount;
      break;
    case 'right':
      position[0] += amount;
      break;
    case 'down':
      position[1] += amount;
      break;
    default:
      // Catch occasions where direction is not defined for whatever reason (should never happen).
      break;
  }

  cropperWindow.setPosition(...position);
});

ipcMain.on('ask-user-to-save-file', (event, data) => {
  const kapturesDir = settings.getSync('save-to-directory') || `${homedir()}/Movies/Kaptures`; // TODO
  const filters = data.type === 'mp4' ? [{name: 'Movies', extensions: ['mp4']}] : [{name: 'Images', extensions: ['gif']}];
  mkdirp(kapturesDir, err => {
    if (err) {
      // can be ignored
    }
    dialog.showSaveDialog({
      title: data.fileName,
      defaultPath: `${kapturesDir}/${data.fileName}`,
      filters
    }, fileName => {
      if (fileName) {
        fsRename(data.filePath, fileName);
      }
      mainWindow.webContents.send('save-dialog-closed');
    });
  });
});

ipcMain.on('open-post-recording-window', (event, opts) => {
  if (postRecWindow) {
    postRecWindow.show();
    if (opts.notify === true) {
      postRecWindow.webContents.send('show-notification');
    }
    return;
  }
  postRecWindow = new BrowserWindow({
    width: 768,
    height: 432,
    frame: false,
    transparent: true,
    resizable: false,
    shadow: true
  });

  postRecWindow.loadURL(`file://${__dirname}/../renderer/html/post-recording.html`);

  postRecWindow.webContents.on('did-finish-load', () => postRecWindow.webContents.send('video-src', opts.filePath));

  postRecWindow.on('closed', () => {
    postRecWindow = undefined;
    app.postRecWindow = undefined;
  });

  app.postRecWindow = postRecWindow;
  menubar.setOption('hidden', true);
  mainWindow.hide();
  tray.setHighlightMode('never');
  app.dock.show();
});

ipcMain.on('close-post-recording-window', () => {
  if (postRecWindow) {
    postRecWindow.close();
    menubar.setOption('hidden', false);
    if (mainWindowIsDetached === false) {
      app.dock.hide();
    }
  }
});

ipcMain.on('export-to-gif', (event, data) => {
  mainWindow.webContents.send('export-to-gif', data);
  mainWindow.show();
});

ipcMain.on('set-main-window-visibility', (event, opts) => {
  if (opts.alwaysOnTop === true && opts.temporary === true && opts.forHowLong) {
    menubar.setOption('alwaysOnTop', true);

    setTimeout(() => {
      menubar.setOption('alwaysOnTop', false);
      tray.setHighlightMode('never');
      if (mainWindowIsDetached === false) {
        mainWindow.hide();
      }
    }, opts.forHowLong);
  }
});
