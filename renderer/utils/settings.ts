import {ipcRenderer as ipc} from 'electron';
import {ipcRenderer} from 'electron-better-ipc';

export function getSetting<T = unknown>(key: string): T {
  return ipc.sendSync('get-setting', key) as T;
}

export function setSetting<T = unknown>(key: string, value: T) {
  return ipc.send('set-setting', {key, value});
}

export const settings = {
  get: getSetting,
  set: setSetting,
  onDidChange: <T = unknown>(key: string, cb: (value: T) => void): (() => void) => {
    const unsubscribe = ipcRenderer.answerMain<{key: string; value: T}>('setting-changed', args => {
      if (args.key === key) {
        cb(args.value);
      }
    });

    ipcRenderer.callMain('subscribe-setting', key);

    return () => {
      unsubscribe();
      ipcRenderer.callMain('unsubscribe-setting', key);
    };
  }
};
