'use strict';

const os = require('os');
const {Menu, app, dialog} = require('electron');
const {openNewGitHubIssue, appMenu} = require('electron-util');
const {supportedVideoExtensions} = require('./common/constants');
const {openPrefsWindow} = require('./preferences');
const {openExportsWindow} = require('./exports');
const {openAboutWindow} = require('./about');
const {openEditorWindow} = require('./editor');
const {closeAllCroppers} = require('./cropper');

const issueBody = `
<!--
Thank you for helping us test Kap. Your feedback helps us make Kap better for everyone!

Before you continue; please make sure you've searched our existing issues to avoid duplicates. When you're ready to open a new issue, include as much information as possible. You can use the handy template below for bug reports.

Step to reproduce:    If applicable, provide steps to reproduce the issue you're having.
Current behavior:     A description of how Kap is currently behaving.
Expected behavior:    How you expected Kap to behave.
Workaround:           A workaround for the issue if you've found on. (this will help others experiencing the same issue!)
-->

**macOS version:**    ${os.release()} (darwin)
**Kap version:**      ${app.getVersion()}

#### Steps to reproduce

#### Current behavior

#### Expected behavior

#### Workaround

<!-- If you have additional information, enter it below. -->
`;

const openFileItem = {
  label: 'Open Video…',
  accelerator: 'Command+O',
  click: () => {
    closeAllCroppers();

    dialog.showOpenDialog({
      filters: [{name: 'Videos', extensions: supportedVideoExtensions}],
      properties: ['openFile']
    }, filePaths => {
      if (filePaths) {
        for (const file of filePaths) {
          openEditorWindow(file);
        }
      }
    });
  }
};

const sendFeedbackItem = {
  label: 'Send Feedback…',
  click() {
    openNewGitHubIssue({
      user: 'wulkano',
      repo: 'kap',
      body: issueBody
    });
  }
};

const aboutItem = {
  label: `About ${app.getName()}`,
  click: openAboutWindow
};

const exportHistoryItem = {
  label: 'Export History',
  click: openExportsWindow,
  enabled: false,
  id: 'exports'
};

const preferencesItem = {
  label: 'Preferences…',
  accelerator: 'Command+,',
  click: openPrefsWindow
};

const cogMenuTemplate = [
  aboutItem,
  {
    type: 'separator'
  },
  sendFeedbackItem,
  {
    type: 'separator'
  },
  openFileItem,
  exportHistoryItem,
  {
    type: 'separator'
  },
  preferencesItem,
  {
    type: 'separator'
  },
  {
    role: 'quit',
    accelerator: 'Command+Q'
  }
];

const appMenuItem = appMenu([preferencesItem]);

appMenuItem.submenu[0] = aboutItem;

const applicationMenuTemplate = [
  appMenuItem,
  {
    label: 'File',
    submenu: [
      openFileItem,
      {
        type: 'separator'
      },
      {
        role: 'close'
      }
    ]
  },
  {
    role: 'editMenu'
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize'
      },
      {
        role: 'zoom'
      },
      {
        type: 'separator'
      },
      exportHistoryItem,
      {
        type: 'separator'
      },
      {
        role: 'front'
      }
    ]
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [sendFeedbackItem]
  }
];

const cogMenu = Menu.buildFromTemplate(cogMenuTemplate);
const cogExportsItem = cogMenu.getMenuItemById('exports');

const applicationMenu = Menu.buildFromTemplate(applicationMenuTemplate);
const applicationExportsItem = applicationMenu.getMenuItemById('exports');

const toggleExportMenuItem = enabled => {
  cogExportsItem.enabled = enabled;
  applicationExportsItem.enabled = enabled;
};

const setApplicationMenu = () => {
  Menu.setApplicationMenu(applicationMenu);
};

module.exports = {
  cogMenu,
  toggleExportMenuItem,
  setApplicationMenu
};
