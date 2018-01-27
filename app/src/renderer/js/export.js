import {ipcRenderer, remote} from 'electron';

import {handleTrafficLightsClicks} from '../js/utils';

// const {app} = remote;

document.addEventListener('DOMContentLoaded', () => {
  // const trafficLightsWrapper = document.querySelector('.title-bar__controls');
  const progressBar = document.querySelector('#progress-bar');
  const progressCancelBtn = document.querySelector('.progress-bar-cancel-btn');

  handleTrafficLightsClicks();

  progressCancelBtn.onclick = () => {
    ipcRenderer.send('cancel-export');
  };

  ipcRenderer.on('start-export', () => {
    console.log('start export');
  });

  ipcRenderer.on('export-progress', (e, data) => {
    console.log('progress', e, data);

    if (data.percentage) {
      progressBar.value = data.percentage * 100;
    } else {
      // TODO: How do I get the indeterminate progress bar?
      progressBar.value = 0;
    }
  });

  ipcRenderer.on('end-export', () => {
    console.log('export done');
    // progressBarLabel.innerText = 'Success 🎉'; // TODO: What should it say here?
    // progressBar.value = 100;
  });
});

