document.addEventListener('DOMContentLoaded', () => {
  const fs = require('fs');

  const aperture = require('aperture.js')();
  const fileSize = require('file-size');
  const moment = require('moment');

  const title = document.querySelector('.title');
  const time = document.querySelector('.time');
  const size = document.querySelector('.size');

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
    aperture.startRecording()
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

  document.querySelector('.start').onclick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
});
