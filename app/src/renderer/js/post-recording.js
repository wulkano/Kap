import {remote, ipcRenderer} from 'electron';
import aspectRatio from 'aspectratio';
import moment from 'moment';

// note: `./` == `/app/dist/renderer/views`, not `js`
import {handleKeyDown, validateNumericInput} from '../js/input-utils';

document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.querySelector('.js-play-video');
  const pauseBtn = document.querySelector('.js-pause-video');
  const previewTime = document.querySelector('.js-video-time');
  const discardBtn = document.querySelector('.discard');
  const inputHeight = document.querySelector('.input-height');
  const inputWidth = document.querySelector('.input-width');
  const fps15Btn = document.querySelector('#fps-15');
  const fps30Btn = document.querySelector('#fps-30');
  const loopOffBtn = document.querySelector('#loop-off');
  const loopOnBtn = document.querySelector('#loop-on');
  const preview = document.querySelector('#preview');
  const progressBar = document.querySelector('progress');
  const saveBtn = document.querySelector('.save');

  let fps = 30;
  let loop = true;

  let lastValidInputWidth;
  let lastValidInputHeight;
  let aspectRatioBaseValues;

  preview.oncanplay = function () {
    aspectRatioBaseValues = [this.videoWidth, this.videoHeight];
    [inputWidth.value, inputHeight.value] = aspectRatioBaseValues;
    [lastValidInputWidth, lastValidInputHeight] = aspectRatioBaseValues;

    progressBar.max = preview.duration;
    setInterval(() => {
      progressBar.value = preview.currentTime;
      previewTime.innerText = `${moment().startOf('day').seconds(preview.currentTime).format('m:ss')}`;
    }, 1);

    // remove the listener since it's called
    // every time the video loops
    preview.oncanplay = undefined;
  };

  pauseBtn.addEventListener('click', () => {
    pauseBtn.classList.add('hidden');
    playBtn.classList.remove('hidden');
    preview.pause();
  });

  playBtn.addEventListener('click', () => {
    playBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    preview.play();
  });

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

  function confirmDiscard() {
    remote.dialog.showMessageBox(remote.app.kap.postRecWindow, {
      type: 'question',
      buttons: ['No', 'Yes'],
      message: 'Are you sure that you want to discard this recording?',
      detail: 'It will not be saved'
    }, response => {
      if (response === 1) { // `Yes`
        ipcRenderer.send('close-post-recording-window');
      }
    });
  }

  discardBtn.onclick = confirmDiscard;
  window.onkeyup = event => {
    if (event.keyCode === 27) { // esc
      confirmDiscard();
    }
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
});
