'use strict';

const {BrowserWindow, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const pify = require('pify');
const {ipcMain: ipc} = require('electron-better-ipc');
const {is} = require('electron-util');
const moment = require('moment');

const getFps = require('./utils/fps');
const loadRoute = require('./utils/routes');

const editors = new Map();
let exportOptions;
const OPTIONS_BAR_HEIGHT = 48;
const VIDEO_ASPECT = 9 / 16;
const MIN_VIDEO_WIDTH = 768;
const MIN_VIDEO_HEIGHT = MIN_VIDEO_WIDTH * VIDEO_ASPECT;
const MIN_WINDOW_HEIGHT = MIN_VIDEO_HEIGHT + OPTIONS_BAR_HEIGHT;
const editorEmitter = new EventEmitter();

const getEditorName = (filePath, isNewRecording) => isNewRecording ? `New Recording ${moment().format('YYYY-MM-DD')} at ${moment().format('H.mm.ss')}` : path.basename(filePath);

const openEditorWindow = async (filePath, {recordedFps, isNewRecording, originalFilePath} = {}) => {
  if (editors.has(filePath)) {
    editors.get(filePath).show();
    return;
  }

  const fps = recordedFps || await getFps(filePath);

  const editorWindow = new BrowserWindow({
    title: getEditorName(originalFilePath || filePath, isNewRecording),
    minWidth: MIN_VIDEO_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    width: MIN_VIDEO_WIDTH,
    height: MIN_WINDOW_HEIGHT,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: !is.development // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
    },
    frame: false,
    transparent: true,
    vibrancy: 'dark',
    show: false
  });

  editors.set(filePath, editorWindow);

  loadRoute(editorWindow, 'editor');

  if (isNewRecording) {
    editorWindow.setDocumentEdited(true);
    editorWindow.on('close', event => {
      const buttonIndex = dialog.showMessageBoxSync(editorWindow, {
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
      }
    });
  }

  editorWindow.on('closed', () => {
    editors.delete(filePath);
  });

  editorWindow.on('blur', () => {
    editorEmitter.emit('blur');
    ipc.callRenderer(editorWindow, 'blur');
  });
  editorWindow.on('focus', () => {
    editorEmitter.emit('focus');
    ipc.callRenderer(editorWindow, 'focus');
  });

  editorWindow.webContents.on('did-finish-load', async () => {
    ipc.callRenderer(editorWindow, 'export-options', exportOptions);
    await ipc.callRenderer(editorWindow, 'file', {filePath, fps, originalFilePath, isNewRecording});
    editorWindow.show();
  });
};

const setOptions = options => {
  exportOptions = options;
};

const getEditors = () => editors.values();

ipc.answerRenderer('save-original', async ({inputPath}) => {
  const now = moment();

  const {filePath} = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    defaultPath: `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.mp4`
  });

  if (filePath) {
    await pify(fs.copyFile)(inputPath, filePath, fs.constants.COPYFILE_FICLONE);
  }
});

module.exports = {
  openEditorWindow,
  setOptions,
  getEditors,
  editorEmitter
};
