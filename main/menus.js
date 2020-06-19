'use strict';

const os = require('os');
const {Menu, app, dialog, BrowserWindow} = require('electron');
const {openNewGitHubIssue, appMenu} = require('electron-util');
const {ipcMain: ipc} = require('electron-better-ipc');
const delay = require('delay');

const {supportedVideoExtensions, defaultInputDevice} = require('./common/constants');
const settings = require('./common/settings');
const {hasMicrophoneAccess} = require('./common/system-permissions');
const {getAudioDevices} = require('./utils/devices');
const {ensureDockIsShowing} = require('./utils/dock');
const {openPrefsWindow} = require('./preferences');
const {openExportsWindow} = require('./exports');
const {closeAllCroppers} = require('./cropper');
const {editorEmitter} = require('./editor');
const openFiles = require('./utils/open-files');

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
  click: async () => {
    closeAllCroppers();

    await delay(200);

    await ensureDockIsShowing(async () => {
      const {canceled, filePaths} = await dialog.showOpenDialog({
        filters: [{name: 'Videos', extensions: supportedVideoExtensions}],
        properties: ['openFile', 'multiSelections']
      });

      if (!canceled && filePaths) {
        openFiles(...filePaths);
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
  label: `About ${app.name}`,
  click: () => {
    closeAllCroppers();
    ensureDockIsShowing(() => {
      app.showAboutPanel();
    });
  }
};

let isExportsItemEnabled = false;

const exportHistoryItem = {
  label: 'Export History',
  click: openExportsWindow,
  enabled: isExportsItemEnabled,
  id: 'exports'
};

const preferencesItem = {
  label: 'Preferences…',
  accelerator: 'Command+,',
  click: () => openPrefsWindow()
};

let pluginsItems = [];

const getPluginsItem = () => ({
  id: 'plugins',
  label: 'Plugins',
  submenu: pluginsItems,
  visible: pluginsItems.length > 0
});

const getMicrophoneItem = async () => {
  const devices = await getAudioDevices();
  const isRecordAudioEnabled = settings.get('recordAudio');

  let audioInputDeviceId = settings.get('audioInputDeviceId');
  if (!devices.some(device => device.id === audioInputDeviceId)) {
    settings.set('audioInputDeviceId', defaultInputDevice.id);
    audioInputDeviceId = defaultInputDevice.id;
  }

  return {
    id: 'devices',
    label: 'Microphone',
    submenu: [
      {
        label: 'None',
        type: 'checkbox',
        checked: !isRecordAudioEnabled,
        click: () => settings.set('recordAudio', false)
      },
      ...[
        defaultInputDevice,
        ...devices
      ].map(device => ({
        label: device.name,
        type: 'checkbox',
        checked: isRecordAudioEnabled && audioInputDeviceId === device.id,
        click: () => {
          settings.set('recordAudio', true);
          settings.set('audioInputDeviceId', device.id);
        }
      }))
    ],
    visible: hasMicrophoneAccess()
  };
};

const getCogMenuTemplate = async () => [
  aboutItem,
  {
    type: 'separator'
  },
  preferencesItem,
  {
    type: 'separator'
  },
  getPluginsItem(),
  await getMicrophoneItem(),
  {
    type: 'separator'
  },
  openFileItem,
  exportHistoryItem,
  {
    type: 'separator'
  },
  sendFeedbackItem,
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

const appMenuTemplate = [
  appMenuItem,
  {
    role: 'fileMenu',
    submenu: [
      openFileItem,
      {
        type: 'separator'
      },
      {
        label: 'Save Original…',
        id: 'saveOriginal',
        accelerator: 'Command+S',
        click: () => {
          ipc.callRenderer(BrowserWindow.getFocusedWindow(), 'save-original');
        }
      },
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
    role: 'windowMenu',
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

const refreshRecordPluginItems = services => {
  pluginsItems = services.map(service => ({
    label: service.title,
    type: 'checkbox',
    checked: service.isEnabled,
    click: service.toggleEnabled
  }));
};

const appMenu_ = Menu.buildFromTemplate(appMenuTemplate);
const appExportsItem = appMenu_.getMenuItemById('exports');
const appSaveOriginalItem = appMenu_.getMenuItemById('saveOriginal');

const toggleExportMenuItem = enabled => {
  isExportsItemEnabled = enabled;
  appExportsItem.enabled = enabled;
};

const setAppMenu = () => {
  Menu.setApplicationMenu(appMenu_);
};

editorEmitter.on('blur', () => {
  appSaveOriginalItem.visible = false;
});

editorEmitter.on('focus', () => {
  appSaveOriginalItem.visible = true;
});

const getCogMenu = async () => Menu.buildFromTemplate(await getCogMenuTemplate());

module.exports = {
  getCogMenu,
  toggleExportMenuItem,
  setApplicationMenu: setAppMenu,
  refreshRecordPluginItems
};
