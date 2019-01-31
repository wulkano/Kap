'use strict';

const {BrowserWindow, dialog} = require('electron');
const path = require('path');
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

const openEditorWindow = async (filePath, recordFps, {isNewRecording} = {isNewRecording: false}) => {
  if (editors.has(filePath)) {
    editors.get(filePath).show();
    return;
  }

  const fps = recordFps || await getFps(filePath);

  const editorWindow = new BrowserWindow({
    title: path.basename(filePath),
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

  loadRoute(editorWindow, 'editor');

  if (isNewRecording) {
    editorWindow.setDocumentEdited(true);
    editorWindow.on('close', event => {
      const buttonIndex = dialog.showMessageBox(editorWindow, {
        type: 'question',
        buttons: [
          'Discard',
          'Cancel'
        ],
        defaultId: 0,
        cancelId: 1,
        message: 'Are you sure that you want to discard this recording?',
        detail: 'You will no longer be able to edit and export the original recording.'
      });

      if (buttonIndex === 1) {
        event.preventDefault();
      } else {
        editors.delete(filePath);
      }
    });
  }

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
