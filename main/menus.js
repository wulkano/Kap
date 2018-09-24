'use strict';

const {Menu} = require('electron');

const {openPrefsWindow} = require('./preferences');
const {track} = require('./common/analytics');

const cogMenu = [
  {
    role: 'about'
  },
  {
    type: 'separator'
  },
  {
    label: 'Preferences…',
    accelerator: 'Cmd+,',
    click: openPrefsWindow
  },
  {
    type: 'separator'
  },
  {
    role: 'quit',
    accelerator: 'Command+Q'
  }
];

module.exports = {
  cogMenu: Menu.buildFromTemplate(cogMenu)
};
