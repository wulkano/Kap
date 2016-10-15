import {ipcRenderer} from 'electron';

import aspectRatio from 'aspectratio';

// note: `./` == `/app/dist/renderer/html`, not `js`
import {handleKeyDown, validateNumericInput} from '../js/input-utils';

document.addEventListener('DOMContentLoaded', () => {
  const cancelBtn = document.querySelector('.cancel');
  const inputHeight = document.querySelector('.input-height');
  const inputWidth = document.querySelector('.input-width');
  const fps15Btn = document.querySelector('#fps-15');
  const fps30Btn = document.querySelector('#fps-30');
  const loopOffBtn = document.querySelector('#loop-off');
  const loopOnBtn = document.querySelector('#loop-on');
  const notification = document.querySelector('.notification');
  const preview = document.querySelector('#preview');
  const saveBtn = document.querySelector('.save');

  let fps = 30;
  let loop = true;

  let lastValidInputWidth;
  let lastValidInputHeight;
  let aspectRatioBaseValues;
  let notificationTimeoutId;

  window.fps = fps;
  window.loop = loop;

  preview.oncanplay = function () {
    aspectRatioBaseValues = [this.videoWidth, this.videoHeight];
    [inputWidth.value, inputHeight.value] = aspectRatioBaseValues;
    [lastValidInputWidth, lastValidInputHeight] = aspectRatioBaseValues;

    // remove the listener since it's called
    // every time the video loops
    preview.oncanplay = undefined;
  };

  function shake(el) {
    el.classList.add('shake');

    el.addEventListener('webkitAnimationEnd', () => {
      el.classList.remove('shake');
    });

    return true;
  }

  inputWidth.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputWidth,
      empty: true,
      max: preview.videoWidth,
      min: 1,
      onInvalid: shake
    });

    const tmp = aspectRatio.resize(...aspectRatioBaseValues, this.value);
    if (tmp[1]) {
      lastValidInputHeight = tmp[1];
      inputHeight.value = tmp[1];
    }

    lastValidInputWidth = this.value || lastValidInputWidth;
  };

  inputWidth.onkeydown = handleKeyDown;

  inputWidth.onblur = function () {
    this.value = this.value || (shake(this) && lastValidInputWidth); // prevent the input from staying empty
  };

  inputHeight.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputHeight,
      empty: true,
      max: preview.videoHeight,
      min: 1,
      onInvalid: shake
    });

    const tmp = aspectRatio.resize(...aspectRatioBaseValues, undefined, this.value);
    if (tmp[0]) {
      lastValidInputWidth = tmp[0];
      inputWidth.value = tmp[0];
    }

    lastValidInputHeight = this.value || lastValidInputHeight;
  };

  inputHeight.onkeydown = handleKeyDown;

  inputHeight.onblur = function () {
    this.value = this.value || (shake(this) && lastValidInputHeight); // prevent the input from staying empty
  };

  fps15Btn.onclick = function () {
    this.classList.add('active');
    fps30Btn.classList.remove('active');
    fps = 15;
  };

  fps30Btn.onclick = function () {
    this.classList.add('active');
    fps15Btn.classList.remove('active');
    fps = 30;
  };

  loopOffBtn.onclick = function () {
    this.classList.add('active');
    loopOnBtn.classList.remove('active');
    loop = false;
  };

  loopOnBtn.onclick = function () {
    this.classList.add('active');
    loopOffBtn.classList.remove('active');
    loop = true;
  };

  cancelBtn.onclick = () => {
    ipcRenderer.send('close-post-recording-window');
  };

  saveBtn.onclick = () => {
    ipcRenderer.send('export-to-gif', {
      filePath: preview.src,
      width: inputWidth.value,
      height: inputHeight.value,
      fps,
      loop
    });
    ipcRenderer.send('close-post-recording-window');
  };

  ipcRenderer.on('video-src', (event, src) => {
    preview.src = src;
  });

  ipcRenderer.on('show-notification', () => {
    notification.style.opacity = 1;
    shake(notification);
    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
    }
    notificationTimeoutId = setTimeout(() => {
      notification.style.opacity = 0;
    }, 5000);
  });
});
