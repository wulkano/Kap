'use strict';

const os = require('os');
const {Menu, app, dialog, BrowserWindow} = require('electron');
const {openNewGitHubIssue} = require('electron-util');
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

**macOS version:**    ${process.platform} ${process.arch} ${os.release()}
**Kap version:**      ${app.getVersion()}

#### Steps to reproduce

#### Current behavior

#### Expected behavior

#### Workaround

<!-- If you have additional information, enter it below. -->
`;

const cogMenuTemplate = [{
  label: `About ${app.getName()}`,
  click: openAboutWindow
}, {
  type: 'separator'
}, {
  label: 'Send Feedback…',
  click() {
    openNewGitHubIssue({
      user: 'wulkano',
      repo: 'kap',
      body: issueBody
    });
  }
}, {
  type: 'separator'
}, {
  label: 'Open Video…',
  accelerator: 'Command+O',
  click: () => {
    closeAllCroppers();

    dialog.showOpenDialog({
      filters: [
        {name: 'Videos', extensions: supportedVideoExtensions}
      ],
      properties: ['openFile']
    }, filePaths => {
      if (filePaths) {
        for (const file of filePaths) {
          openEditorWindow(file);
        }
      }
    });
  }
}, {
  label: 'Export History…',
  click: openExportsWindow,
  enabled: false,
  id: 'exports'
}, {
  type: 'separator'
}, {
  label: 'Preferences…',
  accelerator: 'Command+,',
  click: openPrefsWindow
}, {
  type: 'separator'
}, {
  role: 'quit',
  accelerator: 'Command+Q'
}];

const applicationMenuTemplate = [{
  label: app.getName(),
  submenu: [{
    label: `About ${app.getName()}`,
    click: openAboutWindow
  }, {
    type: 'separator'
  }, {
    label: 'Preferences…',
    accelerator: 'Command+,',
    click: openPrefsWindow
  }, {
    type: 'separator'
  }, {
    label: 'Services',
    role: 'services',
    submenu: []
  }, {
    type: 'separator'
  }, {
    label: 'Export History…',
    click: openExportsWindow,
    enabled: false,
    id: 'exports'
  }, {
    type: 'separator'
  }, {
    label: `Hide ${app.getName()}`,
    accelerator: 'Command+H',
    role: 'hide'
  }, {
    label: 'Hide Others',
    accelerator: 'Command+Shift+H',
    role: 'hideothers'
  }, {
    label: 'Show All',
    role: 'unhide'
  }, {
    type: 'separator'
  }, {
    role: 'quit',
    accelerator: 'Command+Q'
  }]
}, {
  label: 'File',
  submenu: [{
    label: 'Open Video…',
    accelerator: 'Command+O',
    click: () => {
      closeAllCroppers();

      dialog.showOpenDialog({
        filters: [
          {name: 'Videos', extensions: supportedVideoExtensions}
        ],
        properties: ['openFile']
      }, filePaths => {
        if (filePaths) {
          for (const file of filePaths) {
            openEditorWindow(file);
          }
        }
      });
    }
  }, {
    type: 'separator'
  }, {
    label: 'Close',
    accelerator: 'Command+W',
    click: () => {
      BrowserWindow.getFocusedWindow().close();
    }
  }]
}, {
  label: 'Edit',
  submenu: [{
    label: 'Undo',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: 'Cut',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: 'Select All',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }]
}, {
  label: 'Window',
  role: 'window',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: 'Close',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }]
}, {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: 'Send Feedback…',
    click() {
      openNewGitHubIssue({
        user: 'wulkano',
        repo: 'kap',
        body: issueBody
      });
    }
  }]
}];

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
