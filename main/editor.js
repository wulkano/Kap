'use strict';

const {format: formatUrl} = require('url');
const {BrowserWindow} = require('electron');
const isDev = require('electron-is-dev');
const {resolve} = require('app-root-path');

const devPath = 'http://localhost:8000/editor';

const prodPath = formatUrl({
  pathname: resolve('renderer/out/editor/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath;

let editor = null;

const OPTIONS_BAR_HEIGHT = 48;
const VIDEO_ASPECT = 9 / 16;
const MIN_VIDEO_WIDTH = 768;
const MIN_VIDEO_HEIGHT = MIN_VIDEO_WIDTH * VIDEO_ASPECT;
const MIN_WINDOW_HEIGHT = MIN_VIDEO_HEIGHT + OPTIONS_BAR_HEIGHT;

const openEditorWindow = ({alwaysOnTop = false} = {}) => {
  if (!editor) {
    editor = new BrowserWindow({
      minWidth: MIN_VIDEO_WIDTH,
      minHeight: MIN_WINDOW_HEIGHT,
      width: MIN_VIDEO_WIDTH,
      height: MIN_WINDOW_HEIGHT,
      frame: false,
      webPreferences: {
        webSecurity: !isDev // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
      },
      vibrancy: 'ultra-dark',
      // The below is: `rgba(0, 0, 0, 0.4)`
      // Convert tool: https://kilianvalkhof.com/2016/css-html/css-hexadecimal-colors-with-transparency-a-conversion-tool/
      backgroundColor: '#00000066',
      alwaysOnTop
    });

    editor.loadURL(url);
    editor.on('closed', () => {
      editor = null;
    });
  }
};

module.exports = {
  openEditorWindow
};
