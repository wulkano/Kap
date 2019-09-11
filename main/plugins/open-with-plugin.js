'use strict';
const path = require('path');
const {getAppsThatOpenExtension, openFileWithApp} = require('mac-open-with');

const action = async context => {
  const filePath = await context.filePath();
  openFileWithApp(filePath, context.appUrl);
};

const apps = new Map(
  ['mp4', 'gif', 'apng', 'webm']
    .map(extension => [
      extension,
      getAppsThatOpenExtension.sync(extension).map(app => ({
        ...app,
        name: decodeURI(path.parse(app.url).name)
      }))
    ])
    .filter(([_, apps]) => apps.length > 0)
);

module.exports.shareServices = [{
  title: 'Open With',
  formats: [...apps.keys()],
  action
}];

module.exports.apps = apps;
