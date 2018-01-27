import {ipcRenderer, remote, dialog} from 'electron';

import {handleTrafficLightsClicks} from '../js/utils';

let isExportInProgress = false;

window.onbeforeunload = e => {
  if (isExportInProgress) {
    const buttonIndex = dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'question',
      buttons: ['Cancel Export', 'Continue'],
      defaultId: 1,
      message: 'Are you sure you want to cancel exporting?',
      detail: 'It will not be saved'
    });
    if (buttonIndex === 0) {
      ipcRenderer.send('cancel-export');
    } else {
      e.returnValue = true; // Prevents closing
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.querySelector('#progress-bar');
  const progressCancelBtn = document.querySelector('.progress-bar-cancel-btn');

  handleTrafficLightsClicks();

  progressCancelBtn.onclick = () => {
    window.close();
  };

  ipcRenderer.on('start-export', () => {
    isExportInProgress = true;
  });

  ipcRenderer.on('export-progress', (e, data) => {
    console.log('progress', e, data);

    if (data.percentage) {
      progressBar.value = data.percentage * 100;
    } else {
      progressBar.value = 0;
    }
  });

  ipcRenderer.on('end-export', () => {
    isExportInProgress = false;
  });
});

