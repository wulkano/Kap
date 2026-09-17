import sinon from 'sinon';
import tempy from 'tempy';
import path from 'path';
import fs from 'fs';

const temporaryDir = tempy.directory();

process.env.TZ = 'America/New_York';
(process.versions as any).chrome = '';

export const app = {
  getPath: (name: string) => {
    const directory = path.resolve(temporaryDir, name);
    fs.mkdirSync(directory, {recursive: true});
    return directory;
  },
  isPackaged: false,
  getVersion: '',
  quit: sinon.fake(),
  dock: {
    isVisible: () => true,
    show: sinon.fake(),
    hide: sinon.fake()
  }
};

export const shell = {
  showItemInFolder: sinon.fake(),
  openExternal: sinon.fake(async () => undefined)
};

export const clipboard = {
  writeText: sinon.fake()
};

export const dialog = {
  showMessageBox: sinon.fake(async () => ({response: 1}))
};

// Mirrors `systemPreferences.getMediaAccessStatus`. Tests set
// `mediaAccessStatus.screen` to drive the permission state.
export const mediaAccessStatus: {screen: string; microphone: string} = {
  screen: 'granted',
  microphone: 'granted'
};

export const systemPreferences = {
  getMediaAccessStatus: sinon.fake((mediaType: 'screen' | 'microphone') => mediaAccessStatus[mediaType]),
  askForMediaAccess: sinon.fake(async () => true)
};

export const desktopCapturer = {
  getSources: sinon.fake(async () => [])
};

export const remote = {};
