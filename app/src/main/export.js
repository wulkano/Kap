import {BrowserWindow, dialog, ipcMain} from 'electron';

let exportWindow;
let isExportInProgress = false;

export function startExport() {
  exportWindow = new BrowserWindow({
    width: 400,
    height: 170,
    resizable: false,
    maximizable: false,
    titleBarStyle: 'hiddenInset'
  });

  exportWindow.loadURL(`file://${__dirname}/../renderer/views/export.html`);

  exportWindow.webContents.on('dom-ready', () => {
    exportWindow.webContents.send('start-export');
  });

  exportWindow.on('close', event => {
    if (isExportInProgress) {
      const buttonIndex = dialog.showMessageBox(exportWindow, {
        type: 'question',
        buttons: ['Cancel Export', 'Continue'],
        defaultId: 1,
        cancelId: 1,
        message: 'Are you sure you want to cancel the export?'
      });
      if (buttonIndex === 0) {
        exportWindow.webContents.send('should-cancel-export');
      }
      event.preventDefault();
    } else {
      exportWindow = null;
    }
  });

  isExportInProgress = true;
}

export function exportProgress(payload) {
  if (!exportWindow) {
    return;
  }
  exportWindow.send('export-progress', payload);
}

export function hideExportWindow() {
  if (!exportWindow) {
    return;
  }
  isExportInProgress = false;
  exportWindow.close();
}

export function endExport() {
  if (!exportWindow) {
    return;
  }
  isExportInProgress = false;
  exportWindow.send('end-export');
  setTimeout(() => {
    exportWindow.close();
  }, 1000);
}
