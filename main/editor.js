'use strict';

const {format: formatUrl} = require('url');
const {BrowserWindow} = require('electron');
const isDev = require('electron-is-dev');
const {resolve} = require('app-root-path');

const devPath = 'http://localhost:8000/editor';

const prodPath = formatUrl({
  pathname: resolve('renderer/out/cropper/index.html'),
  protocol: 'file:',
  slashes: true
});

const url = isDev ? devPath : prodPath;

let editor = null;

const openEditorWindow = () => {
  if (!editor) {
    const width = 768;
    const barHeight = 48;
    const height = 768 * 9 / 16 + barHeight;
    editor = new BrowserWindow({
      minWidth: width,
      minHeight: height,
      webPreferences: {
        webSecurity: false
      },
      width,
      height,
      frame: false,
      vibrancy: 'ultra-dark',
      // The below is: `rgba(0, 0, 0, 0.4)`
      // Convert tool: https://kilianvalkhof.com/2016/css-html/css-hexadecimal-colors-with-transparency-a-conversion-tool/
      backgroundColor: '#00000066',
      alwaysOnTop: true
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
