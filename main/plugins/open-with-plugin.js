'use strict';
const path = require('path');
const {getAppsThatOpenExtension, openFileWithApp} = require('mac-open-with');
const {getFormatExtension} = require('../common/constants');

const action = async context => {
  const filePath = await context.filePath();
  openFileWithApp(filePath, context.appUrl);
};

const apps = new Map(
  ['mp4', 'gif', 'apng', 'webm', 'av1']
    .map(format => [
      format,
      getAppsThatOpenExtension.sync(getFormatExtension(format))
        .map(app => ({
          ...app,
          name: decodeURI(path.parse(app.url).name)
        }))
        .filter(app => !['Kap', 'Kap Beta'].includes(app.name))
        .sort((a, b) => {
          if (a.isDefault !== b.isDefault) {
            return b.isDefault - a.isDefault;
          }

          return (b.name === 'Gifski') - (a.name === 'Gifski');
        })
    ])
    .filter(([_, apps]) => apps.length > 0)
);

module.exports.shareServices = [{
  title: 'Open With',
  formats: [...apps.keys()],
  action
}];

module.exports.apps = apps;
