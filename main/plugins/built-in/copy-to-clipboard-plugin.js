'use strict';
const {clipboard} = require('electron');
const plist = require('plist');

const copyFileReferencesToClipboard = filePaths => {
  clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(plist.build(filePaths)));
};

const action = async context => {
  const filePath = await context.filePath();
  copyFileReferencesToClipboard([filePath]);
  context.notify(`The ${context.prettyFormat} has been copied to the clipboard`);
};

const copyToClipboard = {
  title: 'Copy to Clipboard',
  formats: [
    'gif',
    'apng'
  ],
  action
};

module.exports.shareServices = [copyToClipboard];
