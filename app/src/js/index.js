const fs = require('fs');

const aperture = require('aperture.js')();
const fileSize = require('file-size');
const {ipcRenderer} = require('electron');
const moment = require('moment');

function setWindowSize() {
  const width = document.documentElement.scrollWidth;
  const height = document.documentElement.scrollHeight;
  ipcRenderer.send('set-main-window-size', {width, height});
}

document.addEventListener('DOMContentLoaded', () => {
  const bigRedBtn = document.querySelector('#big-red-btn');
  const controlsTitleWrapper = document.querySelector('.controls-title-wrapper');
  const inputWidth = document.querySelector('#aspect-ratio-width');
  const inputHeight = document.querySelector('#aspect-ratio-height');
  const options = document.querySelector('.options');
  const size = document.querySelector('#size');
  const swapBtn = document.querySelector('.swap-btn');
  const time = document.querySelector('#time');
  const triangle = document.querySelector('#triangle');
  const windowTitle = document.querySelector('#window-title');

  let recording = false;

  let monitoringIntervalId;

  let lastValidInputWidth = 512;
  let lastValidInputHeight = 512;

  function startMonitoringElapsedTimeAndSize(filePath) {
    const startedAt = moment();

    monitoringIntervalId = setInterval(() => {
      // TODO: split this into two intervals: one for time (1000ms)
      // and one for size (500ms)
      const now = moment();

      const elapsed = moment.utc(now.diff(startedAt)).format('mm:ss');
      time.innerText = elapsed;

      fs.stat(filePath, (err, stats) => {
        if (!err) {
          size.innerText = fileSize(stats.size).human('si');
        } // TODO: track this error
      });
    }, 500);
  }

  function stopMonitoring() {
    clearInterval(monitoringIntervalId);
  }

  function startRecording() { // eslint-disable-line no-unused-vars
    ipcRenderer.send('will-start-recording');
    const past = Date.now();
    recording = true;
    document.activeElement.blur(); // make sure the fps `onblur` validations are executed

    let cropperBounds;
    if (ipcRenderer.sendSync('is-cropper-active')) {
      cropperBounds = ipcRenderer.sendSync('get-cropper-bounds');
      // convert the coordinates to cartesian coordinates, which are used by CoreMedia
      cropperBounds.y = screen.height - (cropperBounds.y + cropperBounds.height);

       // the dashed border is 2px wide
      cropperBounds.x += 2;
      cropperBounds.y += 2;
      cropperBounds.width -= 4;
      cropperBounds.height -= 4;
    }

    aperture.startRecording({
      cropArea: cropperBounds
    })
      .then(filePath => {
        windowTitle.innerText = 'Recording ✅';
        startMonitoringElapsedTimeAndSize(filePath);
        console.log(`Started recording after ${(Date.now() - past) / 1000}s`);
      })
      .catch(err => {
        ipcRenderer.send('will-stop-recording');
        recording = false;
        console.error(err);
        windowTitle.innerText = 'Error 😔';
      });
  }

  function askUserToSaveFile(opts) {
    if (!opts.filePath || !opts.fileName) {
      throw new Error('askUserToSaveFile must be called with {filePath, fileName}');
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = opts.filePath;
    a.download = opts.fileName;
    document.body.appendChild(a);
    a.click();
  }

  function stopRecording() {
    ipcRenderer.send('will-stop-recording');
    stopMonitoring();
    aperture.stopRecording()
      .then(filePath => {
        recording = false;
        windowTitle.innerText = 'Focus';
        time.innerText = '00:00';
        size.innerText = '0 kB';
        const fileName = `Screen record ${Date()}.mp4`;
        askUserToSaveFile({fileName, filePath});
      });
  }

  bigRedBtn.onclick = function () {
    if (recording) {
      stopRecording();
    } else {
      const state = this.attributes['data-state'].value;
      if (state === 'initial') {
        ipcRenderer.send('open-cropper-window', {
          width: parseInt(inputWidth.value, 10),
          height: parseInt(inputHeight.value, 10)
        });
      }
      // startRecording();
    }
  };

  controlsTitleWrapper.onclick = function () {
    const controls = document.querySelector('.controls');

    triangle.classList.toggle('up');

    controls.classList.toggle('hidden');
    setWindowSize();
  };

  options.onclick = event => {
    const {bottom, left} = options.getBoundingClientRect();
    ipcRenderer.send('show-options-menu', {x: left, y: bottom});
    event.stopPropagation();
  };

  function shake(input) {
    input.classList.add('invalid');

    input.addEventListener('webkitAnimationEnd', () => {
      input.classList.remove('invalid');
    })

    return true;
  }

  function validateNumericInput(input, opts) {
    let value = input.value;
    if (value === '' && opts.empty) {
      return value;
    }

    if (!value || !opts || !opts.lastValidValue) {
      return undefined;
    }

    value = parseInt(value, 10);

    if (!/^\d{1,5}$/.test(value)) {
      opts.onInvalid(input);
      return opts.lastValidValue;
    }

    if (opts.max && value > opts.max) {
      opts.onInvalid(input);
      return opts.max;
    }

    if (opts.min && value < opts.min) {
      opts.onInvalid(input);
      return opts.min;
    }

    return value;
  }

  inputWidth.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputWidth,
      empty: true,
      max: screen.width,
      min: 1,
      onInvalid: shake
    });
    lastValidInputWidth = this.value || lastValidInputWidth;
  };

  inputWidth.onblur = function () {
    this.value = this.value || (shake(this) && 512); // prevent the input from staying empty
  };

  inputHeight.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputHeight,
      empty: true,
      max: screen.height - screen.availTop, // currently we can't draw over the menubar,
      min: 1,
      onInvalid: shake
    });
    lastValidInputHeight = this.value || lastValidInputHeight;
  };

  inputHeight.onblur = function () {
    this.value = this.value || (shake(this) && 512); // prevent the input from staying empty
  };

  swapBtn.onclick = () => {
    [inputWidth.value, inputHeight.value] = [inputHeight.value, inputWidth.value];
    inputWidth.oninput();
    inputHeight.oninput();
  }
});

window.addEventListener('load', setWindowSize);
