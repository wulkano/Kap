import {app, BrowserWindow, ipcMain, dialog} from 'electron';

export function startExport() {
  const exportWindow = new BrowserWindow({
    width: 400,
    height: 170,
    resizable: false,
    frame: false
  });

  app.kap.exportWindow = exportWindow;

  exportWindow.loadURL(`file://${__dirname}/../renderer/views/export.html`);
  exportWindow.webContents.send('start-export');
}

export function exportProgress(payload) {
  app.kap.exportWindow.send('export-progress', payload);
}

export function hideExportWindow() {
  app.kap.exportWindow.close();
}

export function endExport() {
  app.kap.exportWindow.send('end-export');
  setTimeout(() => {
    app.kap.exportWindow.close();
  });
}
