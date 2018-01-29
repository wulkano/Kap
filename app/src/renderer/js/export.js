import {ipcRenderer} from 'electron';

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.querySelector('#progress-bar');
  const progressCancelBtn = document.querySelector('.progress-bar-cancel-btn');
  const windowTitleLabel = document.querySelector('.window__title.txt');

  const updateTitle = text => {
    windowTitleLabel.textContent = text;
  };

  progressCancelBtn.onclick = () => {
    ipcRenderer.send('cancel-export');
  };

  ipcRenderer.on('should-cancel-export', () => {
    ipcRenderer.send('cancel-export');
  });

  ipcRenderer.on('start-export', () => {
    updateTitle('Exporting…');
  });

  ipcRenderer.on('export-progress', (e, {text, percentage}) => {
    progressBar.value = percentage ? percentage * 100 : 0;
    if (text) {
      updateTitle(text);
    }
  });

  ipcRenderer.on('end-export', () => {
    progressBar.value = 100;
    progressCancelBtn.disabled = true;
    updateTitle('Success 🎉');
  });
});

