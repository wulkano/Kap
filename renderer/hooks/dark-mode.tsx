import {ipcRenderer} from 'electron-better-ipc';
import {useState, useEffect} from 'react';

const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    ipcRenderer.callMain<never, boolean>('get-dark-mode').then(value => {
      setIsDarkMode(value);
    });

    return ipcRenderer.answerMain<boolean>('dark-mode-changed', value => {
      setIsDarkMode(value);
    });
  });

  return {isDarkMode, isReady: isDarkMode !== undefined};
};

export default useDarkMode;
