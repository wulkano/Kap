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

const openEditorWindow = ({alwaysOnTop = false} = {}) => {
  if (!editor) {
    const width = 768;
    const barHeight = 48;
    const height = 768 * 9 / 16 + barHeight;
    editor = new BrowserWindow({
      minWidth: width,
      minHeight: height,
      width,
      height,
      frame: false,
      webPreferences: {
        webSecurity: !isDev // Disable webSecurity in dev to load video over file:// protocol
      },
      vibrancy: 'ultra-dark',
      // The below is: `rgba(0, 0, 0, 0.4)`
      // Convert tool: https://kilianvalkhof.com/2016/css-html/css-hexadecimal-colors-with-transparency-a-conversion-tool/
      backgroundColor: '#00000066',
      alwaysOnTop
    });

    // editor.setAspectRatio(16 / 9, { width: 0, height: 48 })

    editor.loadURL(url);
    editor.on('closed', () => {
      editor = null;
    });
  }
};

module.exports = {
  openEditorWindow
};
