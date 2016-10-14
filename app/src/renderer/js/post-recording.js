import {ipcRenderer} from 'electron';

document.addEventListener('DOMContentLoaded', () => {
  const cancelBtn = document.querySelector('.cancel');
  const inputHeight = document.querySelector('.input-height');
  const inputWidth = document.querySelector('.input-width');
  const fps15Btn = document.querySelector('#fps-15');
  const fps30Btn = document.querySelector('#fps-30');
  const loopOffBtn = document.querySelector('#loop-off');
  const loopOnBtn = document.querySelector('#loop-on');
  const preview = document.querySelector('#preview');
  const saveBtn = document.querySelector('save');

  let fps = 30;
  let loop = true;

  preview.oncanplay = function () {
    inputWidth.value = this.videoWidth;
    inputHeight.value = this.videoHeight;

    // remove the listener since it's called
    // every time the video loops
    preview.oncanplay = undefined;
  };

  fps15Btn.onclick = () => {
    fps = 15;
  };

  fps30Btn.onclick = () => {
    fps = 30;
  };

  loopOffBtn.onclick = () => {
    loop = false;
  };

  loopOnBtn.onclick = () => {
    loop = true;
  };

  cancelBtn.onclick = () => {
    ipcRenderer.send('close-post-recording-window');
  };

  ipcRenderer.on('video-src', (event, src) => {
    preview.src = src;
  });
});
