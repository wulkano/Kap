const fs = require('fs');

const aperture = require('aperture.js')();
const fileSize = require('file-size');
const {ipcRenderer} = require('electron');
const moment = require('moment');

function setWindowSize() {
  const width = document.documentElement.scrollWidth;
  const height = document.documentElement.scrollHeight;
  ipcRenderer.send('set-window-size', {width, height});
}

document.addEventListener('DOMContentLoaded', () => {
  const compressCheckbox = document.querySelector('#compress');
  const cropBtn = document.querySelector('#crop');
  const fps = document.querySelector('#fps');
  const fpsInputWrapper = document.querySelector('.fps-input-wrapper');
  const options = document.querySelector('#options');
  const recordBtn = document.querySelector('#record');
  const settingsTitleWrapper = document.querySelector('.settings-title-wrapper');
  const size = document.querySelector('#size');
  const time = document.querySelector('#time');
  const title = document.querySelector('.title');

  const spinnerFrames = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
  let currentSpinnerFrame = 0;

  let recording = false;

  let monitoringIntervalId;
  let spinnerIntervalId;

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

  function startSpinner(text) {
    spinnerIntervalId = setInterval(() => {
      const frame = spinnerFrames[currentSpinnerFrame];
      currentSpinnerFrame = ++currentSpinnerFrame % spinnerFrames.length;

      title.innerText = `${text} ${frame}`;
    }, 100);
  }

  function stopSpinner() {
    clearInterval(spinnerIntervalId);
  }

  function startRecording() {
    const past = Date.now();
    startSpinner('Starting');
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
      fps: fps.value,
      cropArea: cropperBounds,
      compress: compressCheckbox.checked
      })
      .then(filePath => {
        stopSpinner();
        title.innerText = 'Recording ✅';
        startMonitoringElapsedTimeAndSize(filePath);
        console.log(`Started recording after ${(Date.now() - past) / 1000}s`);
      })
      .catch(err => {
        recording = false;
        console.error(err);
        stopSpinner();
        title.innerText = 'Error 😔';
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
    stopMonitoring();
    stopSpinner();
    startSpinner('Processing')
    aperture.stopRecording()
      .then(filePath => {
        recording = false;
        stopSpinner();
        title.innerText = 'Focus';
        time.innerText = '00:00';
        size.innerText = '0 kB';
        const fileName = `Screen record ${Date()}.mp4`;
        askUserToSaveFile({fileName, filePath});
      });
  }

  recordBtn.onclick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  settingsTitleWrapper.onclick = function () {
    const arrow = this.children[1];
    const settings = document.querySelector('.settings');

    arrow.classList.toggle('up');
    arrow.classList.toggle('down');

    settings.classList.toggle('hidden');
    setWindowSize();

    window.arrow = arrow;
  };

  fps.onkeyup = function () {
    if (!/^[0-9]{1,2}$/.test(this.value) && this.value.trim() !== '') {
      this.value = 30;
    } else if (this.value < 0) {
      this.value = 0;
    } else if (this.value > 60) {
      this.value = 60;
    }
  };

  fps.onblur = function () {
    if (this.value.trim() === '' || this.value === '0') {
      this.value = 30;
    }
  };

  options.onclick = () => {
    const {bottom, left} = options.getBoundingClientRect();
    ipcRenderer.send('show-options-menu', {x: left, y: bottom});
  };

  fpsInputWrapper.onclick = () => {
    fps.focus();
    fps.value = fps.value; // move the carret to the end
  };

  cropBtn.onclick = function () {
    ipcRenderer.send('open-cropper-window');
  };
});

window.addEventListener('load', setWindowSize);
