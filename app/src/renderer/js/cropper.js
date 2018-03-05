import {ipcRenderer} from 'electron';
import {init as initErrorReporter} from '../../common/reporter';

const arrows = {
  left: 'ArrowLeft',
  up: 'ArrowUp',
  right: 'ArrowRight',
  down: 'ArrowDown'
};

document.addEventListener('DOMContentLoaded', () => {
  const autoDestroy = () => {
    ipcRenderer.send('close-cropper-window');
  };

  const move = (direction, amount) => {
    ipcRenderer.send('move-cropper-window', {direction, amount});
  };

  let intervalId;
  let timeoutId;

  const keyUp = event => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    switch (event.key) {
      case 'Escape':
        autoDestroy();
        break;
      case 'Enter':
        ipcRenderer.send('start-recording');
        break;
      case ' ':
        ipcRenderer.send('start-recording');
        break;
      default:
        break;
    }
  };

  const keyDown = event => {
    if (!timeoutId && !intervalId) {
      const direction = Object.keys(arrows).find(key => arrows[key] === event.key);
      const amount = event.shiftKey ? 10 : 1;

      if (direction) {
        move(direction, amount);
        timeoutId = setTimeout(() => {
          intervalId = setInterval(() => move(direction, amount), 50);
        }, 250);
      }
    }
  };

  window.addEventListener('keyup', keyUp, false);
  window.addEventListener('keydown', keyDown, false);
  initErrorReporter();
});
