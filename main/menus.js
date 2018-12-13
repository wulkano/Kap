'use strict';

const os = require('os');
const {Menu, shell, app, dialog} = require('electron');
const {supportedVideoExtensions} = require('./common/constants');
const {openPrefsWindow} = require('./preferences');
const {showExportsWindow} = require('./exports');
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

const cogMenuTemplate = [
  {
    label: `About ${app.getName()}`,
    click: openAboutWindow
  },
  {
    type: 'separator'
  },
  {
    label: 'Send Feedback…',
    click: () => shell.openExternal(`https://github.com/wulkano/kap/issues/new?body=${encodeURIComponent(issueBody)}`)
  },
  {
    type: 'separator'
  },
  {
    label: 'Open Video…',
    accelerator: 'Cmd+o',
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
  },
  {
    label: 'Export History…',
    click: showExportsWindow,
    enabled: false,
    id: 'exports'
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

const cogMenu = Menu.buildFromTemplate(cogMenuTemplate);
const exportsItem = cogMenu.getMenuItemById('exports');

const toggleExportMenuItem = enabled => {
  exportsItem.enabled = enabled;
};

module.exports = {
  cogMenu,
  toggleExportMenuItem
};
