'use strict';

const {BrowserWindow} = require('electron');
const {ipcMain: ipc} = require('electron-better-ipc');

const loadRoute = require('./utils/routes');

const showDialog = options => new Promise(resolve => {
  const dialogWindow = new BrowserWindow({
    width: 1,
    height: 1,
    resizable: false,
    minimizable: false,
    fullscreenable: false,
    vibrancy: 'window',
    show: false,
    alwaysOnTop: true,
    center: true,
    title: '',
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  loadRoute(dialogWindow, 'dialog');

  let buttons;
  let actionTaken;

  const updateUi = async newOptions => {
    actionTaken = true;
    buttons = newOptions.buttons.map(button => {
      if (typeof button === 'string') {
        return {label: button};
      }

      return button;
    });

    const cancelButton = buttons.findIndex(({label}) => label === 'Cancel');

    const {width, height} = await ipc.callRenderer(dialogWindow, 'data', {
      cancelId: cancelButton > 0 ? cancelButton : undefined,
      ...options,
      ...newOptions,
      buttons: buttons.map(({label, activeLabel}) => ({label, activeLabel})),
      id: dialogWindow.id
    });

    const bounds = dialogWindow.getBounds();
    const titleBarHeight = dialogWindow.getSize()[1] - dialogWindow.getContentSize()[1];

    dialogWindow.setBounds({
      width: Math.max(width, bounds.width),
      height: Math.max(height + titleBarHeight, bounds.height)
    });
  };

  const unsubscribe = ipc.answerRenderer(`dialog-action-${dialogWindow.id}`, async index => {
    if (buttons[index]) {
      if (buttons[index].action) {
        actionTaken = false;
        await buttons[index].action(cleanup, updateUi);

        if (!actionTaken) {
          cleanup(index);
        }
      } else {
        cleanup(index);
      }
    } else {
      cleanup();
    }
  });

  const cleanup = value => {
    actionTaken = true;
    unsubscribe();
    dialogWindow.close();
    resolve(value);
  };

  dialogWindow.webContents.on('did-finish-load', async () => {
    await updateUi(options);
    dialogWindow.show();
  });
});

module.exports = {
  showDialog
};
