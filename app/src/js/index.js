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
  const cropBtn = document.querySelector('#crop');
  const cropBtnImg = document.querySelector('#crop-btn-img');
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
        size.innerText = fileSize(stats.size).human('si');
      });
    }, 500);
  }

  function stopMonitoring() {
    clearInterval(monitoringIntervalId);
  }

  function startSpinner() {
    spinnerIntervalId = setInterval(() => {
      const frame = spinnerFrames[currentSpinnerFrame];
      currentSpinnerFrame = ++currentSpinnerFrame % spinnerFrames.length;

      title.innerText = `Starting ${frame}`;
    }, 100);
  }

  function stopSpinner() {
    clearInterval(spinnerIntervalId);
  }

  function startRecording() {
    const past = Date.now();
    startSpinner();
    recording = true;
    document.activeElement.blur(); // make sure the fps `onblur` validations are executed
    aperture.startRecording({fps: fps.value})
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
    aperture.stopRecording()
      .then(filePath => {
        recording = false;
        stopMonitoring();
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
    if (this.classList.contains('active')) { // is active (green)
      cropBtnImg.src = '../static/crop.png';
      cropBtnImg.srcset = '../static/crop.png 1x, ../static/crop@2x.png 2x';
    } else { // is not active (gray)
      cropBtnImg.src = '../static/crop-active.png';
      cropBtnImg.srcset = '../static/crop-active.png 1x, ../static/crop-active@2x.png 2x';
    }
    ipcRenderer.send('open-cropper-window');
    this.classList.toggle('active');
  };
});

window.addEventListener('load', setWindowSize);
