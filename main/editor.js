'use strict';

const {format: formatUrl} = require('url');
const path = require('path');
const fs = require('fs');
const electron = require('electron');
const {BrowserWindow} = require('electron');
const isDev = require('electron-is-dev');
const {resolve} = require('app-root-path');
const ipc = require('electron-better-ipc');
const {converters} = require('./convert');

const devPath = 'http://localhost:8000/editor';

const prodPath = formatUrl({
  pathname: resolve('renderer/out/editor/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath;

const OPTIONS_BAR_HEIGHT = 48;
const VIDEO_ASPECT = 9 / 16;
const MIN_VIDEO_WIDTH = 768;
const MIN_VIDEO_HEIGHT = MIN_VIDEO_WIDTH * VIDEO_ASPECT;
const MIN_WINDOW_HEIGHT = MIN_VIDEO_HEIGHT + OPTIONS_BAR_HEIGHT;

const openEditorWindow = filePath => {
  const editorWindow = new BrowserWindow({
    minWidth: MIN_VIDEO_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    width: MIN_VIDEO_WIDTH,
    height: MIN_WINDOW_HEIGHT,
    frame: false,
    webPreferences: {
      webSecurity: !isDev // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
    },
    transparent: true,
    show: false
  });

  editorWindow.loadURL(url);
  if (isDev) {
    editorWindow.openDevTools({mode: 'detach'});
  }

  editorWindow.webContents.on('did-finish-load', async () => {
    await ipc.callRenderer(editorWindow, 'filePath', filePath);
    editorWindow.show();
  });
};

const prettifyFormat = format => {
  const formats = new Map([
    ['apng', 'APNG'],
    ['gif', 'GIF'],
    ['mp4', 'MP4'],
    ['webm', 'WebM']
  ]);

  return formats.get(format);
};

ipc.answerRenderer('export-options', () => {
  const cwd = path.join(electron.app.getPath('userData'), 'plugins');
  const pkg = fs.readFileSync(path.join(cwd, 'package.json'), 'utf8');
  const pluginNames = Object.keys(JSON.parse(pkg).dependencies);

  const options = {};
  for (const format of converters.keys()) {
    options[format] = {
      format,
      prettyFormat: prettifyFormat(format),
      plugins: []
    };
  }

  for (const pluginName of pluginNames) {
    const plugin = require(path.join(cwd, 'node_modules', pluginName));
    for (const service of plugin.shareServices) {
      for (const format of service.formats) {
        options[format].plugins.push({title: service.title, pluginName});
      }
    }
  }

  return options;
});

module.exports = {
  openEditorWindow
};
