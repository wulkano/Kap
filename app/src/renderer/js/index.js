import fs from 'fs';
import aspectRatio from 'aspectratio';
import fileSize from 'file-size';
import {ipcRenderer} from 'electron';
import moment from 'moment';

require('./reporter');

const aperture = require('aperture.js')();

function setMainWindowSize() {
  const width = document.documentElement.scrollWidth;
  const height = document.documentElement.scrollHeight;
  ipcRenderer.send('set-main-window-size', {width, height});
}

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const aspectRatioSelector = document.querySelector('.aspect-ratio-selector');
  const recordBtn = document.querySelector('.record');
  const controlsTitleWrapper = document.querySelector('.controls__toggle');
  const hideWindowBtn = document.querySelector('.hide-window');
  const inputWidth = document.querySelector('#aspect-ratio-width');
  const inputHeight = document.querySelector('#aspect-ratio-height');
  const linkBtn = document.querySelector('.link-btn');
  const minimizeWindowBtn = document.querySelector('.minimize-window');
  const options = document.querySelector('.controls__options');
  const size = document.querySelector('.size');
  const swapBtn = document.querySelector('.swap-btn');
  const time = document.querySelector('.time');
  const trayTriangle = document.querySelector('.tray-arrow');
  const trafficLights = document.querySelector('.title-bar__controls');
  const triangle = document.querySelector('.triangle');
  const windowTitle = document.querySelector('.window__title');

  // Initial variables
  let monitoringIntervalId;
  let lastValidInputWidth = 512;
  let lastValidInputHeight = 512;
  let aspectRatioBaseValues = [lastValidInputWidth, lastValidInputHeight];

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
  }

  function enableInputs() {
    aspectRatioSelector.disabled = false;
    inputWidth.disabled = false;
    inputHeight.disabled = false;
    linkBtn.classList.remove('disabled');
    swapBtn.classList.remove('disabled');
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
        console.log(`Started recording after ${(Date.now() - past) / 1000}s`);
      })
      .catch(err => {
        ipcRenderer.send('will-stop-recording');
        console.error(err);
        setMainWindowTitle('Error');
      });
  }

  function askUserToSaveFile(opts) {
    if (!opts.filePath || !opts.fileName) {
      throw new Error('askUserToSaveFile must be called with {filePath, fileName}');
    }

    ipcRenderer.send('ask-user-to-save-file', opts);
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

        const now = moment();
        const fileName = `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.mp4`;

        recordBtn.attributes['data-state'].value = 'initial';
        recordBtn.children[0].classList.remove('hidden'); // crop btn
        recordBtn.children[1].classList.add('hidden'); // stop btn
        enableInputs();
        askUserToSaveFile({fileName, filePath});
      });
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
    prepareRecordButton();
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

  function shake(input) {
    input.classList.add('invalid');

    input.addEventListener('webkitAnimationEnd', () => {
      input.classList.remove('invalid');
    });

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

  function setCropperWindowSize(width, height) {
    ipcRenderer.send('set-cropper-window-size', {
      width: width || lastValidInputWidth,
      height: height || lastValidInputHeight
    });
  }

  function handleKeyDown(event) {
    if (event.keyCode === 38) { // up
      this.value++;
      this.oninput();
    } else if (event.keyCode === 40) { // down
      this.value--;
      this.oninput();
    }
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

  ipcRenderer.on('unstick-from-menubar', () => {
    trayTriangle.classList.add('hide');
    trafficLights.classList.remove('invisible');
  });

  ipcRenderer.on('stick-to-menubar', () => {
    trayTriangle.classList.remove('hide');
    trafficLights.classList.add('invisible');
  });

  hideWindowBtn.onclick = () => {
    if (!trafficLights.classList.contains('invisible')) {
      ipcRenderer.send('hide-main-window');
    }
  };

  minimizeWindowBtn.onclick = () => {
    if (!trafficLights.classList.contains('invisible')) {
      ipcRenderer.send('minimize-main-window');
    }
  };

  ipcRenderer.on('stop-recording', stopRecording);

  ipcRenderer.on('update-downloaded', () => {
    const title = 'An update is available 🎉';
    const body = 'Click here to install it 😊';

    const notification = new Notification(title, {body});
    notification.onclick = () => {
      ipcRenderer.send('install-update');
    };
  });
});

window.addEventListener('load', setMainWindowSize);
