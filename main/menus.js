'use strict';

const {Menu} = require('electron');

const {openPrefsWindow} = require('./preferences');
const {closeCropperWindow} = require('./cropper');

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
    click() {
      openPrefsWindow();
    }
  },
  checkForUpdatesItem,
  {
    type: 'separator'
  }
];

const quitOption = {
  role: 'quit',
  accelerator: 'Cmd+Q'
};

const exitOption = {
  label: 'Close Kap',
  accelerator: 'Cmd+w',
  click() {
    closeCropperWindow();
  }
};

module.exports = {
  cogMenu: Menu.buildFromTemplate([...cogMenu, quitOption]),
  moreMenu: Menu.buildFromTemplate([...cogMenu, exitOption, quitOption])
};
