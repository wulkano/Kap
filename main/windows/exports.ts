import KapWindow from './kap-window';
import {windowManager} from './manager';

let exportsKapWindow: KapWindow | undefined;

const openExportsWindow = async () => {
  if (exportsKapWindow) {
    exportsKapWindow.browserWindow.focus();
  } else {
    exportsKapWindow = new KapWindow({
      title: 'Exports',
      width: 320,
      height: 360,
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      titleBarStyle: 'hiddenInset',
      frame: false,
      transparent: true,
      vibrancy: 'window',
      webPreferences: {
        nodeIntegration: true
      },
      route: 'exports'
    });

    const exportsWindow = exportsKapWindow.browserWindow;

    const titleBarHeight = 37;
    exportsWindow.setSheetOffset(titleBarHeight);

    exportsWindow.on('close', () => {
      exportsKapWindow = undefined;
    });

    await exportsKapWindow.whenReady();
  }

  return exportsKapWindow.browserWindow;
};

const getExportsWindow = () => exportsKapWindow?.browserWindow;

windowManager.setExports({
  open: openExportsWindow,
  get: getExportsWindow
});
