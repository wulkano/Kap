import {ipcRenderer} from 'electron';
import settings from 'electron-settings';

document.addEventListener('DOMContentLoaded', () => {
  settings.get('openOnStartup').then(val => {
    console.log(val);
  });

  // Element definitions
  const chooseSaveDirectoryBtn = document.querySelector('.js-choose-save');

  chooseSaveDirectoryBtn.onclick = function () {
    console.log('test');
    ipcRenderer.send('change-save-directory');
  };
});
