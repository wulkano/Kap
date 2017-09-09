import path from 'path';
import fs from 'fs';

import {app, BrowserWindow, ipcMain, Menu, screen, globalShortcut, dialog} from 'electron';
import isDev from 'electron-is-dev';

import {init as initErrorReporter} from '../common/reporter';
import logger from '../common/logger';
import * as settings from '../common/settings-manager';

import autoUpdater from './auto-updater';
import analytics from './analytics';
import {applicationMenu, cogMenu} from './menus';
import plugins from './plugins';

const menubar = require('menubar')({
  index: `file://${__dirname}/../renderer/views/main.html`,
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
const cropperWindowBuffer = 2;
let mainWindowIsDetached = false;
let mainWindow;
let mainWindowIsNew = true;
let positioner;
let editorWindow;
let prefsWindow;
let shouldStopWhenTrayIsClicked = false;
let tray;
let recording = false;

settings.init();

ipcMain.on('set-main-window-size', (event, args) => {
  if (args.width && args.height && mainWindow) {
    [args.width, args.height] = [parseInt(args.width, 10), parseInt(args.height, 10)];
    mainWindow.setSize(args.width, args.height, true); // True == animate
    event.returnValue = true; // Give true to sendSync caller
  }
});

ipcMain.on('set-cropper-window-size', (event, args) => {
  if (args.width && args.height && cropperWindow) {
    [args.width, args.height] = [parseInt(args.width, 10), parseInt(args.height, 10)];
    cropperWindow.setSize(args.width + cropperWindowBuffer, args.height + cropperWindowBuffer, true); // True == animate
  }
});

ipcMain.on('show-options-menu', (event, coordinates) => {
  if (coordinates && coordinates.x && coordinates.y) {
    coordinates.x = parseInt(coordinates.x.toFixed(), 10);
    coordinates.y = parseInt(coordinates.y.toFixed(), 10);

    cogMenu.popup(coordinates.x + 4, coordinates.y); // 4 is the magic number ✨
  }
});

function closeCropperWindow() {
  cropperWindow.close();
  mainWindow.setAlwaysOnTop(false); // TODO send a PR to `menubar`
  menubar.setOption('alwaysOnTop', false);
}

function setCropperWindowOnBlur() {
  cropperWindow.on('blur', () => {
    if (!mainWindow.isFocused() &&
        !cropperWindow.webContents.isDevToolsFocused() &&
        !mainWindow.webContents.isDevToolsFocused() &&
        !recording) {
      closeCropperWindow();
    }
  });
}

ipcMain.on('open-cropper-window', (event, size) => {
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1); // TODO send a PR to `menubar`
  menubar.setOption('alwaysOnTop', true);
  if (cropperWindow) {
    cropperWindow.focus();
  } else {
    let {width = 512, height = 512} = settings.get('cropperWindow.size');
    width = size.width || width;
    height = size.height || height;
    const {x, y} = settings.get('cropperWindow.position');
    cropperWindow = new BrowserWindow({
      width: width + cropperWindowBuffer,
      height: height + cropperWindowBuffer,
      frame: false,
      transparent: true,
      resizable: true,
      hasShadow: false,
      enableLargerThanScreen: true,
      x,
      y
    });
    cropperWindow.loadURL(`file://${__dirname}/../renderer/views/cropper.html`);
    cropperWindow.setIgnoreMouseEvents(false); // TODO this should be false by default
    cropperWindow.setAlwaysOnTop(true, 'screen-saver');

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
      settings.set('cropperWindow.size', size, {volatile: true});
    });

    cropperWindow.on('moved', () => {
      let [x, y] = cropperWindow.getPosition();

      // TODO: we need to implement some logic to, at the same time, allow the user
      // to move the window to another display, but don't allow them to move the window
      // to ouside of a display. it should be tricky to implement – how can we decide if
      // a movement is valid – that is, the window is being moved to another display
      // or it's simply being moved to outside of a display?
      if (screen.getAllDisplays().length === 1) {
        const [width, height] = cropperWindow.getSize();
        const {width: screenWidth, height: screenHeight} = screen.getPrimaryDisplay().bounds;
        const x2 = x + width;
        const y2 = y + height;

        if (x < 0 || y < 0 || x2 > screenWidth || y2 > screenHeight) {
          x = x < 0 ? 0 : x;
          x = x2 > screenWidth ? screenWidth - width : x;
          y = y < 0 ? 0 : y;
          y = y2 > screenHeight ? screenHeight - height : y;
          cropperWindow.setPosition(x, y, true);
        }
      }
      settings.set('cropperWindow.position', {x, y}, {volatile: true});
    });
  }
});

ipcMain.on('close-cropper-window', () => {
  if (cropperWindow && !recording) {
    closeCropperWindow();
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
  appState = 'initial'; // If the icon is being reseted, we are not recording anymore
  shouldStopWhenTrayIsClicked = false;
  tray.setImage(path.join(__dirname, '..', '..', 'static', 'menubarDefaultTemplate.png'));
  menubar.setOption('alwaysOnTop', false);
  mainWindow.setAlwaysOnTop(false);
}

function setTrayStopIcon() {
  shouldStopWhenTrayIsClicked = true;
  tray.setImage(path.join(__dirname, '..', '..', 'static', 'menubarStopTemplate.png'));
}

// Open the Preferences Window
function openPrefsWindow() {
  if (prefsWindow) {
    return prefsWindow.show();
  }

  prefsWindow = new BrowserWindow({
    width: 480,
    height: 480,
    resizable: false,
    minimizable: false,
    maximizable: false,
    titleBarStyle: 'hidden',
    show: false
  });

  prefsWindow.on('close', () => {
    prefsWindow = undefined;
  });

  prefsWindow.loadURL(`file://${__dirname}/../renderer/views/preferences.html`);
  prefsWindow.on('ready-to-show', prefsWindow.show);

  prefsWindow.on('blur', () => {
    // Because of issues on our codebase and on the `menubar` module,
    // for now we'll have this ugly workaround: if the main window is attached
    // to the menubar, we'll just close the prefs window when it loses focus
    if (!mainWindowIsDetached && !prefsWindow.webContents.isDevToolsFocused()) {
      prefsWindow.close();
    }
  });
}

function getCropperWindow() {
  return cropperWindow;
}

app.on('ready', () => {
  // Ensure all plugins are up to date
  plugins.upgrade().catch(() => {});

  globalShortcut.register('Cmd+Shift+5', () => {
    const recording = (appState === 'recording');
    mainWindow.webContents.send((recording) ? 'stop-recording' : 'prepare-recording');
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

function getEditorWindow() {
  return editorWindow;
}

menubar.on('after-create-window', () => {
  let expectedWindowPosition;
  const currentWindowPosition = {};
  mainWindow = menubar.window;
  app.kap = {mainWindow, getCropperWindow, getEditorWindow, openPrefsWindow, settings};
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
      // Close the cropper window if the main window loses focus and the cropper window
      // is not focused
      closeCropperWindow();
    }

    recomputeExpectedWindowPosition();
    recomputeCurrentWindowPosition();
    if (expectedWindowPosition.x !== currentWindowPosition.x || expectedWindowPosition.y !== currentWindowPosition.y) { // This line is too long
      menubar.setOption('x', currentWindowPosition.x);
      menubar.setOption('y', currentWindowPosition.y);
    } else { // Reset the position if the window is back at it's original position
      menubar.setOption('x', undefined);
      menubar.setOption('y', undefined);
    }
  });

  let wasStuck = true;
  mainWindow.on('move', () => { // Unfortunately this is just an alias for 'moved'
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
      // The `move` event is called when the user reselases the mouse button
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
    if (editorWindow) {
      return editorWindow.show();
    }
    if (mainWindowIsNew) {
      mainWindowIsNew = false;
      positioner.move('trayCenter', tray.getBounds()); // Not sure why the fuck this is needed (ﾉಠдಠ)ﾉ︵┻━┻
    }
    if (appState === 'recording' && shouldStopWhenTrayIsClicked) {
      mainWindow.webContents.send('stop-recording');
    } else if (app.dock.isVisible()) {
      mainWindow.show();
    }
  });

  mainWindow.on('hide', () => {
    if (appState === 'recording') {
      setTrayStopIcon();
    }
  });

  menubar.on('show', () => {
    if (mainWindowIsDetached) {
      tray.setHighlightMode('never');
    }
  });

  app.on('activate', () => { // == dockIcon.onclick
    if (!mainWindow.isVisible() && editorWindow === undefined) {
      mainWindow.show();
    }
  });

  mainWindow.once('ready-to-show', () => {
    positioner.move('trayCenter', tray.getBounds()); // Not sure why the fuck this is needed (ﾉಠдಠ)ﾉ︵┻━┻
    mainWindow.show();
  });

  mainWindowIsNew = true;
  autoUpdater.init(mainWindow);
  analytics.init();
  initErrorReporter();
  logger.init(mainWindow);
  Menu.setApplicationMenu(applicationMenu);
});

ipcMain.on('start-recording', () => {
  mainWindow.webContents.send('start-recording');
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
  setTrayStopIcon();
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
    closeCropperWindow();
  }
});

ipcMain.on('hide-window', event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.hide();
});

ipcMain.on('close-window', event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window === prefsWindow && !mainWindowIsDetached) {
    app.dock.hide();
  }
  window.close();
});

ipcMain.on('minimize-window', event => {
  BrowserWindow.fromWebContents(event.sender).minimize();
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

ipcMain.on('open-editor-window', (event, opts) => {
  if (editorWindow) {
    return editorWindow.show();
  }

  editorWindow = new BrowserWindow({
    width: 768,
    minWidth: 768,
    height: 480,
    minHeight: 480,
    frame: false,
    vibrancy: 'dark'
  });

  app.kap.editorWindow = editorWindow;

  editorWindow.loadURL(`file://${__dirname}/../renderer/views/editor.html`);

  editorWindow.webContents.on('did-finish-load', () => editorWindow.webContents.send('video-src', opts.filePath));

  editorWindow.kap = {
    videoFilePath: opts.filePath
  };

  editorWindow.on('closed', () => {
    editorWindow = undefined;
    app.kap.editorWindow = undefined;
  });

  ipcMain.on('toggle-fullscreen-editor-window', () => {
    if (!editorWindow) {
      return;
    }
    if (editorWindow.isFullScreen()) {
      editorWindow.setFullScreen(false);
    } else {
      editorWindow.setFullScreen(true);
    }
  });

  menubar.setOption('hidden', true);
  mainWindow.hide();
  tray.setHighlightMode('never');
  app.dock.show();
});

ipcMain.on('close-editor-window', () => {
  if (!editorWindow) {
    return;
  }

  dialog.showMessageBox(editorWindow, {
    type: 'question',
    buttons: ['Discard', 'Cancel'],
    defaultId: 1,
    message: 'Are you sure that you want to discard this recording?',
    detail: 'It will not be saved'
  }, buttonIndex => {
    if (buttonIndex === 0) {
      // Discard the source video
      fs.unlink(editorWindow.kap.videoFilePath, () => {});

      // For some reason it doesn't close when called in the same tick
      setImmediate(() => {
        editorWindow.close();
      });

      menubar.setOption('hidden', false);
      if (mainWindowIsDetached === true) {
        mainWindow.show();
      } else {
        app.dock.hide();
      }
    }
  });
});

ipcMain.on('export', (event, data) => {
  mainWindow.webContents.send('export', data);
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
