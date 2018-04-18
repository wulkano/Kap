// Packages
const {app, ipcMain, globalShortcut} = require('electron');
const prepareNext = require('electron-next');


const {initializeTray} = require('./tray');
const {startRecording} = require('./aperture');
const settings = require('../common/settings');
const {openCropperWindow} = require('./cropper');

// Prepare the renderer once the app is ready
app.on('ready', async () => {
  app.dock.hide();

  await prepareNext('./renderer');

  global.tray = initializeTray();
  settings.init();
  globalShortcut.register('Cmd+Shift+5', openCropperWindow);
});

app.on('window-all-closed', e => e.preventDefault());

ipcMain.on('start-recording', (event, bounds) => {
  startRecording({x: 0, y: 0, width: 200, height: 100});
});
