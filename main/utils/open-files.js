'use strict';
const path = require('path');

const {supportedVideoExtensions} = require('../common/constants');
const {openEditorWindow} = require('../editor');
const {getEncoding, convertHEVCToH264, convertProResToH264} = require('./encoding');

const fileExtensions = supportedVideoExtensions.map(ext => `.${ext}`);

const openFiles = (...filePaths) => {
  return Promise.all(
    filePaths
      .filter(filePath => fileExtensions.includes(path.extname(filePath).toLowerCase()))
      .map(async filePath => {
        const encoding = await getEncoding(filePath);
        switch (encoding.toLowerCase()) {
          case 'hevc':
            openEditorWindow(await convertHEVCToH264(filePath), {originalFilePath: filePath});
            break;
          case 'prores':
            openEditorWindow(await convertProResToH264(filePath), {originalFilePath: filePath});
            break;
          default:
            openEditorWindow(filePath);
        }
      })
  );
};

module.exports = openFiles;
