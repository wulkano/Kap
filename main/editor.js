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
    editor = new BrowserWindow({
      width: 400,
      height: 200
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
