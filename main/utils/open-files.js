'use strict';
const path = require('path');

const {supportedVideoExtensions} = require('../common/constants');
const {openEditorWindow} = require('../editor');
const {getEncoding, convertToH264} = require('./encoding');

const fileExtensions = supportedVideoExtensions.map(ext => `.${ext}`);

const openFiles = (...filePaths) => {
  return Promise.all(
    filePaths
      .filter(filePath => fileExtensions.includes(path.extname(filePath).toLowerCase()))
      .map(async filePath => {
        const encoding = await getEncoding(filePath);
        const pathToOpen = encoding.toLowerCase() === 'hevc' ? await convertToH264(filePath) : filePath;
        openEditorWindow(pathToOpen);
      })
  );
};

module.exports = openFiles;
