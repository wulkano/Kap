import {remote} from 'electron';
import settings from 'electron-settings';

const {dialog, getCurrentWindow} = remote;

document.addEventListener('DOMContentLoaded', () => {
  settings.get('openOnStartup').then(val => {
    console.log(val);
  });

  // Element definitions
  const chooseSaveDirectoryBtn = document.querySelector('.js-choose-save');
  const header = document.querySelector('header');

  const electronWindow = getCurrentWindow();

  electronWindow.setSheetOffset(header.offsetHeight);

  chooseSaveDirectoryBtn.onclick = function () {
    const location = dialog.showOpenDialog(electronWindow, {properties: ['openDirectory']});
    if (location) {
      settings.set('kapturesDir', location[0]);
    }
  };
});
