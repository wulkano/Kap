import sinon from 'sinon';
import tempy from 'tempy';
import path from 'path';

const temporaryDir = tempy.directory();

process.env.TZ = 'America/New_York';
(process.versions as any).chrome = '';

export const app = {
  getPath: (name: string) => path.resolve(temporaryDir, name),
  isPackaged: false,
  getVersion: () => '3.0.0'
};

export const shell = {
  showItemInFolder: sinon.fake()
};

export const clipboard = {
  writeText: sinon.fake()
};

export const remote = {};

export const Menu = {
  getApplicationMenu: () => ({
    getMenuItemById: () => ({
      enabled: false
    })
  })
};
