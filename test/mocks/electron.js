'use strict';
const sinon = require('sinon');
const tempy = require('tempy');
const path = require('path');

const temporaryDir = tempy.directory();

process.versions.chrome = '';

module.exports = {
  app: {
    getPath: name => path.resolve(temporaryDir, name),
    isPackaged: false
  },
  shell: {
    showItemInFolder: sinon.fake()
  },
  clipboard: {
    writeText: sinon.fake()
  },
  remote: {}
};
