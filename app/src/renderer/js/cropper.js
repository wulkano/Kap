import {ipcRenderer} from 'electron';

require('./reporter');

document.addEventListener('DOMContentLoaded', () => {
  function autoDestroy() {
    ipcRenderer.send('close-cropper-window');
  }

  function keyUp(event) {
    console.log(event);
    if (event.keyCode === 27) { // esc
      autoDestroy();
    }
  }

  window.addEventListener('keyup', keyUp, false);
});
