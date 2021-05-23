import {EditorWindowState} from '../common/types';
import type {Video} from '../video';
import KapWindow from './kap-window';
import {MenuItemId} from '../menus/utils';
import {BrowserWindow, dialog} from 'electron';
import {is} from 'electron-util';
import fs from 'fs';
import {saveSnapshot} from '../utils/image-preview';
import {windowManager} from './manager';

const pify = require('pify');

const OPTIONS_BAR_HEIGHT = 48;
const VIDEO_ASPECT = 9 / 16;
const MIN_VIDEO_WIDTH = 900;
const MIN_VIDEO_HEIGHT = MIN_VIDEO_WIDTH * VIDEO_ASPECT;
const MIN_WINDOW_HEIGHT = MIN_VIDEO_HEIGHT + OPTIONS_BAR_HEIGHT;

const editors = new Map();
const editorsWithNotSavedDialogs = new Map();

const open = async (video: Video) => {
  if (editors.has(video.filePath)) {
    editors.get(video.filePath).show();
    return;
  }

  // TODO: Make this smarter so the editor can show with a spinner while the preview is generated for longer preview conversions (like ProRes)
  await video.whenPreviewReady();

  const editorKapWindow = new KapWindow<EditorWindowState>({
    title: video.title,
    // TODO: Return those to the original values when we are able to resize below min size
    // Upstream issue: https://github.com/electron/electron/issues/27025
    // minWidth: MIN_VIDEO_WIDTH,
    // minHeight: MIN_WINDOW_HEIGHT,
    minWidth: 360,
    minHeight: 392,
    width: MIN_VIDEO_WIDTH,
    height: MIN_WINDOW_HEIGHT,
    backgroundColor: '#222222',
    webPreferences: {
      webSecurity: !is.development // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
    },
    frame: false,
    transparent: true,
    vibrancy: 'window',
    route: 'editor',
    initialState: {
      previewFilePath: video.previewPath!,
      filePath: video.filePath,
      fps: video.fps!,
      title: video.title
    },
    menu: defaultMenu => {
      if (!video.isNewRecording) {
        return;
      }

      const fileMenu = defaultMenu.find(item => item.id === MenuItemId.file);

      if (fileMenu) {
        const submenu = fileMenu.submenu as Electron.MenuItemConstructorOptions[];

        const index = submenu.findIndex(item => item.id === MenuItemId.openVideo);

        if (index > -1) {
          submenu.splice(index + 1, 0, {
            type: 'separator'
          }, {
            label: 'Save Original…',
            id: MenuItemId.saveOriginal,
            accelerator: 'Command+S',
            click: async () => saveOriginal(video)
          });
        }
      }
    }
  });

  const editorWindow = editorKapWindow.browserWindow;

  editors.set(video.filePath, editorWindow);

  if (video.isNewRecording) {
    editorWindow.setDocumentEdited(true);
    editorWindow.on('close', (event: any) => {
      editorsWithNotSavedDialogs.set(video.filePath, true);
      const buttonIndex = dialog.showMessageBoxSync(editorWindow, {
        type: 'question',
        buttons: [
          'Discard',
          'Cancel'
        ],
        defaultId: 0,
        cancelId: 1,
        message: 'Are you sure that you want to discard this recording?',
        detail: 'You will no longer be able to edit and export the original recording.'
      });

      if (buttonIndex === 1) {
        event.preventDefault();
      }

      editorsWithNotSavedDialogs.delete(video.filePath);
    });
  }

  editorWindow.on('closed', () => {
    editors.delete(video.filePath);
  });

  editorWindow.on('blur', () => {
    editorKapWindow.callRenderer('blur');
  });

  editorWindow.on('focus', () => {
    editorKapWindow.callRenderer('focus');
  });

  editorKapWindow.answerRenderer('save-snapshot', (time: number) => {
    saveSnapshot(video, time);
  });
};

const saveOriginal = async (video: Video) => {
  const {filePath} = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow()!, {
    defaultPath: `${video.title}.mp4`
  });

  if (filePath) {
    await pify(fs.copyFile)(video.filePath, filePath, fs.constants.COPYFILE_FICLONE);
  }
};

const areAnyBlocking = () => {
  if (editorsWithNotSavedDialogs.size > 0) {
    const [path] = editorsWithNotSavedDialogs.keys();
    editors.get(path).focus();
    return true;
  }

  return false;
};

windowManager.setEditor({
  open,
  areAnyBlocking
});
