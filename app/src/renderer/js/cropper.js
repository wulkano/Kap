import {ipcRenderer} from 'electron';

import {init as initErrorReporter} from '../../common/reporter';

const arrows = {
  left: 37,
  up: 38,
  right: 39,
  down: 40
};

const ESC_KEY_CODE = 27;

document.addEventListener('DOMContentLoaded', () => {
  function autoDestroy() {
    ipcRenderer.send('close-cropper-window');
  }

  function move(direction, amount) {
    ipcRenderer.send('move-cropper-window', {direction, amount});
  }

  let intervalId;
  let timeoutId;

  function keyUp(event) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    if (event.keyCode === ESC_KEY_CODE) {
      autoDestroy();
    }
  }

  function keyDown(event) {
    if (!timeoutId && !intervalId) {
      const direction = Object.keys(arrows).find(key => arrows[key] === event.keyCode);
      const amount = event.shiftKey ? 10 : 1;
      if (direction) {
        move(direction, amount);
        timeoutId = setTimeout(() => {
          intervalId = setInterval(() => move(direction, amount), 50);
        }, 250);
      }
    }
  }

  window.addEventListener('keyup', keyUp, false);
  window.addEventListener('keydown', keyDown, false);
  initErrorReporter();
});
