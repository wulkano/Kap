import {BrowserWindow} from 'electron';

let exportWindow;

export function startExport() {
  exportWindow = new BrowserWindow({
    width: 400,
    height: 170,
    resizable: false,
    frame: false
  });

  exportWindow.loadURL(`file://${__dirname}/../renderer/views/export.html`);
  exportWindow.webContents.on('dom-ready', () => {
    exportWindow.webContents.send('start-export');
  });
  exportWindow.on('close', () => {
    exportWindow = null;
  });
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
  exportWindow.close();
}

export function endExport() {
  if (!exportWindow) {
    return;
  }
  exportWindow.send('end-export');
  setTimeout(() => {
    exportWindow.close();
  }, 1000);
}
