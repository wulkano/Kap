'use strict';
import path from 'path';
import {supportedVideoExtensions} from '../common/constants';
import {Video} from '../video';

const fileExtensions = supportedVideoExtensions.map(ext => `.${ext}`);

export const openFiles = async (...filePaths: string[]) => {
  return Promise.all(
    filePaths
      .filter(filePath => fileExtensions.includes(path.extname(filePath).toLowerCase()))
      .map(async filePath => {
        return Video.getOrCreate({
          filePath
        }).openEditorWindow();
      })
  );
};

