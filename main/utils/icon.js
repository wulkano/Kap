'use strict';

const fileIcon = require('file-icon');

const getAppIcon = async () => {
  const buffer = await fileIcon.buffer(process.pid);
  return buffer.toString('base64');
};

module.exports = {
  getAppIcon
};
