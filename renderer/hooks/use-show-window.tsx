import {useEffect} from 'react';
import {ipcRenderer} from 'electron-better-ipc';

export const useShowWindow = (show: boolean) => {
  useEffect(() => {
    if (show) {
      ipcRenderer.callMain('kap-window-mount');
    }
  }, [show]);
};
