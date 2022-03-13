import Electron from 'electron';
import fs from 'fs';
import path from 'path';

export const isFirstAppLaunch = (): boolean => {
  const checkFile = path.join(
    Electron.app.getPath('userData'),
    '.app-launched'
  );

  if (fs.existsSync(checkFile)) {
    return false;
  }

  try {
    fs.writeFileSync(checkFile, '');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      fs.mkdirSync(Electron.app.getPath('userData'));
      return isFirstAppLaunch();
    }
  }

  return true;
};
