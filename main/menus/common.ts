import delay from 'delay';
import { app, dialog } from 'electron';
import { openNewGitHubIssue } from 'electron-util';
import macosRelease from '../utils/macos-release';
import { supportedVideoExtensions } from '../common/constants';
import { getCurrentMenuItem, MenuItemId } from './utils';
import { openFiles } from '../utils/open-files';
import { windowManager } from '../windows/manager';

export const getPreferencesMenuItem = () => ({
  id: MenuItemId.preferences,
  label: 'Preferences…',
  accelerator: 'Command+,',
  click: () => windowManager.preferences?.open()
});

export const getAboutMenuItem = () => ({
  id: MenuItemId.about,
  label: `About ${app.name}`,
  click: () => {
    // windowManager.cropper?.close();
    app.focus();
    app.showAboutPanel();
  }
});

export const getOpenFileMenuItem = () => ({
  id: MenuItemId.openVideo,
  label: 'Open Video…',
  accelerator: 'Command+O',
  click: async () => {
    windowManager.cropper?.close();

    await delay(200);

    app.focus();
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'Videos', extensions: supportedVideoExtensions }],
      properties: ['openFile', 'multiSelections']
    });

    if (!canceled && filePaths) {
      openFiles(...filePaths);
    }
  }
});

export const getExportHistoryMenuItem = () => ({
  label: 'Export History',
  click: () => windowManager.exports?.open(),
  enabled: getCurrentMenuItem(MenuItemId.exportHistory)?.enabled ?? false,
  id: MenuItemId.exportHistory
});

export const getSendFeedbackMenuItem = () => ({
  id: MenuItemId.sendFeedback,
  label: 'Send Feedback…',
  click() {
    openNewGitHubIssue({
      user: 'wulkano',
      repo: 'kap',
      body: issueBody
    });
  }
});

const release = macosRelease();

const issueBody = `
<!--
Thank you for helping us test Kap. Your feedback helps us make Kap better for everyone!

Before you continue; please make sure you've searched our existing issues to avoid duplicates. When you're ready to open a new issue, include as much information as possible. You can use the handy template below for bug reports.

Step to reproduce:    If applicable, provide steps to reproduce the issue you're having.
Current behavior:     A description of how Kap is currently behaving.
Expected behavior:    How you expected Kap to behave.
Workaround:           A workaround for the issue if you've found on. (this will help others experiencing the same issue!)
-->

**macOS version:**    ${release.name} (${release.version})
**Kap version:**      ${app.getVersion()}

#### Steps to reproduce

#### Current behavior

#### Expected behavior

#### Workaround

<!-- If you have additional information, enter it below. -->
`;

