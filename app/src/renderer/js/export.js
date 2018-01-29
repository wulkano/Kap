import {ipcRenderer, remote} from 'electron';

const {dialog} = remote;

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.querySelector('#progress-bar');
  const progressCancelBtn = document.querySelector('.progress-bar-cancel-btn');

  progressCancelBtn.onclick = () => {
    ipcRenderer.send('cancel-export');
  };

  ipcRenderer.on('should-cancel-export', () => {
    ipcRenderer.send('cancel-export');
  });

  ipcRenderer.on('start-export', () => {
    // NOOP
  });

  ipcRenderer.on('export-progress', (e, {percentage}) => {
    progressBar.value = percentage ? percentage * 100 : 0;
  });

  ipcRenderer.on('end-export', () => {
    progressBar.value = 100;
    progressCancelBtn.disabled = true;
  });
});

