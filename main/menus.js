'use strict';

const {Menu, shell} = require('electron');

const {openPrefsWindow} = require('./preferences');

// Const {checkForUpdates} = require('./auto-updater');

const checkForUpdatesItem = {
  label: 'Check for Updates…',
  click(item) {
    item.enabled = false;
    // CheckForUpdates(() => {
    //   // This will be called if no update is available
    //   (new Notification({
    //     title: 'No updates available!',
    //     body: 'You will automatically receive updates as soon as they are available 🤗'
    //   })).show();
    // });
  }
};

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
  checkForUpdatesItem,
  {
    label: 'Send us feedback…',
    click: () => shell.openExternal('https://github.com/wulkano/kap/issues/new?template=beta.md')
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
