import fs from 'fs';

import {ipcRenderer, remote, shell} from 'electron';

import aspectRatio from 'aspectratio';
import fileSize from 'file-size';
import moment from 'moment';

import {convert as convertToGif} from '../../scripts/mp4-to-gif';
import {init as initErrorReporter} from '../../common/reporter';
import {log} from '../../common/logger';

// note: `./` == `/app/dist/renderer/views`, not `js`
import {handleKeyDown, validateNumericInput} from '../js/input-utils';

const aperture = require('aperture.js')();

function setMainWindowSize() {
  const width = document.documentElement.scrollWidth;
  const height = document.documentElement.scrollHeight;
  ipcRenderer.send('set-main-window-size', {width, height});
}

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const aspectRatioSelector = document.querySelector('.aspect-ratio-selector');
  const controlsSection = document.querySelector('section.controls');
  const controlsTitleWrapper = document.querySelector('.controls-toggle');
  const exportAs = document.querySelector('#export-as');
  const header = document.querySelector('.kap-header');
  const hideWindowBtn = document.querySelector('.hide-window');
  const inputWidth = document.querySelector('#aspect-ratio-width');
  const inputHeight = document.querySelector('#aspect-ratio-height');
  const linkBtn = document.querySelector('.link-btn');
  const minimizeWindowBtn = document.querySelector('.minimize-window');
  const openReleaseNotesBtn = document.querySelector('.open-release-notes');
  const options = document.querySelector('.controls-options');
  const progressBar = document.querySelector('#progress-bar');
  const progressBarLabel = document.querySelector('.progress-bar-label');
  const progressBarSection = document.querySelector('section.progress');
  const recordBtn = document.querySelector('.record');
  const restartAndInstallUpdateBtn = document.querySelector('.restart-and-install-update');
  const size = document.querySelector('.size');
  const swapBtn = document.querySelector('.swap-btn');
  const time = document.querySelector('.time');
  const titleBar = document.querySelector('.title-bar');
  const trafficLights = document.querySelector('.title-bar__controls');
  const trayTriangle = document.querySelector('.tray-arrow');
  const triangle = document.querySelector('.triangle');
  const updateNotification = document.querySelector('.update-notification');
  const windowTitle = document.querySelector('.window__title');

  // Initial variables
  let monitoringIntervalId;
  let lastValidInputWidth = 512;
  let lastValidInputHeight = 512;
  let aspectRatioBaseValues = [lastValidInputWidth, lastValidInputHeight];
  let hasUpdateNotification = false;

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

  function setMainWindowTitle(title) {
    windowTitle.innerText = title;
  }

  function disableInputs() {
    aspectRatioSelector.disabled = true;
    inputWidth.disabled = true;
    inputHeight.disabled = true;
    linkBtn.classList.add('disabled');
    swapBtn.classList.add('disabled');
    exportAs.disabled = true;
  }

  function enableInputs() {
    aspectRatioSelector.disabled = false;
    inputWidth.disabled = false;
    inputHeight.disabled = false;
    linkBtn.classList.remove('disabled');
    swapBtn.classList.remove('disabled');
    exportAs.disabled = false;
  }

  function startRecording() {
    disableInputs();
    ipcRenderer.send('will-start-recording');
    setMainWindowTitle('Getting ready...');
    const past = Date.now();

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
        recordBtn.attributes['data-state'].value = 'ready-to-stop';
        recordBtn.children[0].classList.add('hidden'); // crop btn
        recordBtn.children[1].classList.remove('hidden'); // stop btn
        startMonitoringElapsedTimeAndSize(filePath);
        setMainWindowTitle('Recording');
        ipcRenderer.send('started-recording');
        log(`Started recording after ${(Date.now() - past) / 1000}s`);
      })
      .catch(err => {
        ipcRenderer.send('will-stop-recording');
        log(err);
        setMainWindowTitle('Error');
      });
  }

  function askUserToSaveFile(opts) {
    if (!opts.filePath || !opts.fileName) {
      throw new Error('askUserToSaveFile must be called with {filePath, fileName}');
    }

    ipcRenderer.send('ask-user-to-save-file', opts);
  }

  function restoreInputs() {
    recordBtn.attributes['data-state'].value = 'initial';
    recordBtn.children[0].classList.remove('hidden'); // crop btn
    recordBtn.children[1].classList.add('hidden'); // stop btn
    enableInputs();
  }

  function stopRecording() {
    ipcRenderer.send('will-stop-recording');
    stopMonitoring();
    aperture.stopRecording()
      .then(filePath => {
        ipcRenderer.send('stopped-recording');
        windowTitle.innerText = 'Kap';
        time.innerText = '00:00';
        size.innerText = '0 kB';

        if (exportAs.value === 'mp4') {
          const now = moment();
          const fileName = `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.mp4`;

          restoreInputs();
          askUserToSaveFile({fileName, filePath, type: 'mp4'});
        } else { // gif
          restoreInputs();

          // header.classList.add('hidden');
          // controlsSection.classList.add('hidden');
          // progressBarSection.classList.remove('hidden');
          // setMainWindowSize();
          //
          // function progressCallback(percentage) { // eslint-disable-line no-inner-declarations
          //   progressBarLabel.innerText = 'Processing...';
          //   progressBar.value = percentage;
          // }
          //
          // convertToGif(filePath, progressCallback)
          //   .then(gifPath => {
          //     const now = moment();
          //     const fileName = `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.gif`;
          //
          //     progressBar.value = 100;
          //
          //     askUserToSaveFile({fileName, filePath: gifPath, type: 'gif'});
          //   });
          //   // TODO catch

          ipcRenderer.send('open-post-recording-window', {filePath});
        }
      });
  }

  function shake(el) {
    el.classList.add('shake');

    el.addEventListener('webkitAnimationEnd', () => {
      el.classList.remove('shake');
    });

    return true;
  }

  // Prepare recording button for recording state
  // - Either opens the crop window or starts recording
  function prepareRecordButton() {
    const state = recordBtn.attributes['data-state'].value;
    if (state === 'initial') {
      ipcRenderer.send('open-cropper-window', {
        width: parseInt(inputWidth.value, 10),
        height: parseInt(inputHeight.value, 10)
      });
      recordBtn.classList.add('filled');
      recordBtn.attributes['data-state'].value = 'ready-to-record';
    } else if (state === 'ready-to-record') {
      startRecording();
    } else if (state === 'ready-to-stop') {
      stopRecording();
    }
  }

  recordBtn.onclick = function () {
    if (remote.app.kap.postRecWindow) {
      // we need to keep the window visible to show the shake animation
      // (it'll be auto hidden by `menubar` when the post recording window gain focus)
      ipcRenderer.send('set-main-window-visibility', {
        alwaysOnTop: true,
        temporary: true,
        forHowLong: 1000
      });
      shake(this);
      ipcRenderer.send('open-post-recording-window', {notify: true});
    } else {
      prepareRecordButton();
    }
  };

  controlsTitleWrapper.onclick = function () {
    const controls = document.querySelector('.controls-content');

    triangle.classList.toggle('up');

    controls.classList.toggle('hidden');
    setMainWindowSize();
  };

  options.onclick = event => {
    const {bottom, left} = options.getBoundingClientRect();
    ipcRenderer.send('show-options-menu', {x: left, y: bottom});
    event.stopPropagation();
  };

  function setCropperWindowSize(width, height) {
    ipcRenderer.send('set-cropper-window-size', {
      width: width || lastValidInputWidth,
      height: height || lastValidInputHeight
    });
  }

  inputWidth.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputWidth,
      empty: true,
      max: screen.width,
      min: 1,
      onInvalid: shake
    });

    if (linkBtn.classList.contains('active')) {
      const tmp = aspectRatio.resize(...aspectRatioBaseValues, this.value);
      if (tmp[1]) {
        lastValidInputHeight = tmp[1];
        inputHeight.value = tmp[1];
      }
    }

    lastValidInputWidth = this.value || lastValidInputWidth;
    setCropperWindowSize();
  };

  inputWidth.onkeydown = handleKeyDown;

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

    if (linkBtn.classList.contains('active')) {
      const tmp = aspectRatio.resize(...aspectRatioBaseValues, undefined, this.value);
      if (tmp[0]) {
        lastValidInputWidth = tmp[0];
        inputWidth.value = tmp[0];
      }
    }

    lastValidInputHeight = this.value || lastValidInputHeight;
    setCropperWindowSize();
  };

  inputHeight.onkeydown = handleKeyDown;

  inputHeight.onblur = function () {
    this.value = this.value || (shake(this) && 512); // prevent the input from staying empty
  };

  swapBtn.onclick = () => {
    [inputWidth.value, inputHeight.value] = [inputHeight.value, inputWidth.value];
    inputWidth.oninput();
    inputHeight.oninput();
  };

  linkBtn.onclick = function () {
    this.classList.toggle('active');
  };

  aspectRatioSelector.onchange = function () {
    const values = this.value.split('x');
    if (values.length === 2) {
      [inputWidth.value, inputHeight.value] = values;
      aspectRatioBaseValues = values;
      setCropperWindowSize(...values);
    }
  };

  ipcRenderer.on('prepare-recording', () => prepareRecordButton());

  ipcRenderer.on('cropper-window-closed', () => {
    recordBtn.classList.remove('filled');
    recordBtn.attributes['data-state'].value = 'initial';
  });

  ipcRenderer.on('cropper-window-new-size', (event, size) => {
    if (inputWidth !== document.activeElement && inputHeight !== document.activeElement) {
      [inputWidth.value, inputHeight.value] = [size.width, size.height];
    }
  });

  function setTrayTriangleVisible(visible = true) {
    const color = hasUpdateNotification ? '#28CA42' : 'white';
    trayTriangle.style.borderBottom = `1rem solid ${visible ? color : 'transparent'}`;
  }

  ipcRenderer.on('unstick-from-menubar', () => {
    setTrayTriangleVisible(false);
    trafficLights.classList.remove('invisible');
  });

  ipcRenderer.on('stick-to-menubar', () => {
    setTrayTriangleVisible();
    trafficLights.classList.add('invisible');
  });

  hideWindowBtn.onclick = () => {
    if (!trafficLights.classList.contains('invisible')) {
      ipcRenderer.send('hide-window');
    }
  };

  minimizeWindowBtn.onclick = () => {
    if (!trafficLights.classList.contains('invisible')) {
      ipcRenderer.send('minimize-window');
    }
  };

  ipcRenderer.on('stop-recording', stopRecording);

  ipcRenderer.on('update-downloaded', () => {
    const title = 'An update is available 🎉';
    const body = 'Click here to install it 😊';

    hasUpdateNotification = true;
    titleBar.classList.add('has-update-notification');
    updateNotification.classList.remove('hidden');

    // if the traffic lights are invisible, the triangle should be visible
    // if they are visible, the tray triangle should be invisible
    setTrayTriangleVisible(trafficLights.classList.contains('invisible')); // to update the color

    setMainWindowSize();

    openReleaseNotesBtn.onclick = () => shell.openExternal('https://github.com/wulkano/kap/releases/latest');
    restartAndInstallUpdateBtn.onclick = () => ipcRenderer.send('install-update');

    const notification = new Notification(title, {body});
    notification.onclick = () => ipcRenderer.send('install-update');
  });

  ipcRenderer.on('save-dialog-closed', () => {
    progressBarSection.classList.add('hidden');
    header.classList.remove('hidden');
    controlsSection.classList.remove('hidden');
    delete progressBar.value;
    progressBarLabel.innerText = 'Analyzing...';
    setMainWindowSize();
  });

  ipcRenderer.on('log', (event, msgs) => console.log(...msgs));

  ipcRenderer.on('export-to-gif', (event, data) => {
    header.classList.add('hidden');
    controlsSection.classList.add('hidden');
    progressBarSection.classList.remove('hidden');
    setMainWindowSize();

    function progressCallback(percentage) {
      // eslint-disable-line no-inner-declarations
      progressBarLabel.innerText = 'Processing...';
      progressBar.value = percentage;
    }

    data.progressCallback = progressCallback;

    convertToGif(data).then(gifPath => {
      const now = moment();
      const fileName = `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.gif`;

      progressBar.value = 100;

      askUserToSaveFile({fileName, filePath: gifPath, type: 'gif'});
    });
    // TODO catch
  });

  initErrorReporter();
});

window.addEventListener('load', setMainWindowSize);
