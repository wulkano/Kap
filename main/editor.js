'use strict';

const {BrowserWindow, app} = require('electron');
const ipc = require('electron-better-ipc');
const {is} = require('electron-util');

const getFps = require('./utils/fps');
const loadRoute = require('./utils/routes');

const editors = new Map();
let exportOptions;

const OPTIONS_BAR_HEIGHT = 48;
const VIDEO_ASPECT = 9 / 16;
const MIN_VIDEO_WIDTH = 768;
const MIN_VIDEO_HEIGHT = MIN_VIDEO_WIDTH * VIDEO_ASPECT;
const MIN_WINDOW_HEIGHT = MIN_VIDEO_HEIGHT + OPTIONS_BAR_HEIGHT;

const openEditorWindow = async (filePath, recordFps) => {
  if (editors.has(filePath)) {
    editors.get(filePath).show();
    return;
  }
  const fps = recordFps || await getFps(filePath);

  const editorWindow = new BrowserWindow({
    minWidth: MIN_VIDEO_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    width: MIN_VIDEO_WIDTH,
    height: MIN_WINDOW_HEIGHT,
    frame: false,
    webPreferences: {
      webSecurity: !is.development // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
    },
    transparent: true,
    show: false
  });

  editors.set(filePath, editorWindow);
  app.dock.show();

  loadRoute(editorWindow, 'editor');

  editorWindow.on('closed', () => {
    editors.delete(filePath);
    if (editors.size === 0) {
      app.dock.hide();
    }
  });

  editorWindow.webContents.on('did-finish-load', async () => {
    ipc.callRenderer(editorWindow, 'export-options', exportOptions);
    await ipc.callRenderer(editorWindow, 'file', {filePath, fps});
    editorWindow.show();
  });
};

const setOptions = options => {
  exportOptions = options;
};

const getEditors = () => editors.values();

module.exports = {
  openEditorWindow,
  setOptions,
  getEditors
};
