import {ipcRenderer, remote, shell} from 'electron';

import aspectRatio from 'aspectratio';
import moment from 'moment';

import {init as initErrorReporter, report as reportError} from '../../common/reporter';
import {log} from '../../common/logger';

// Note: `./` == `/app/dist/renderer/views`, not `js`
import {handleKeyDown, validateNumericInput} from '../js/input-utils';
import {handleTrafficLightsClicks, isVisible, disposeObservers} from '../js/utils';

const aperture = require('aperture')();

const {app} = remote;

// Observers that should be disposed when the window unloads
const observersToDispose = [];

function setMainWindowSize() {
  const width = document.documentElement.scrollWidth;
  const height = document.documentElement.scrollHeight;
  ipcRenderer.send('set-main-window-size', {width, height});
}

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const mainBody = document.querySelector('body');
  const aspectRatioSelector = document.querySelector('.aspect-ratio-selector');
  const startBar = document.querySelector('.start-bar');
  const startBarOptions = document.querySelector('.start-bar__content');
  const controls = document.querySelector('.controls-content');
  const inputWidth = document.querySelector('#aspect-ratio-width');
  const inputHeight = document.querySelector('#aspect-ratio-height');
  const linkBtn = document.querySelector('.link-btn');
  const openReleaseNotesBtn = document.querySelector('.open-release-notes');
  const options = document.querySelector('.controls-options');
  const progressBar = document.querySelector('#progress-bar');
  const progressBarLabel = document.querySelector('.progress-bar-label');
  const progressBarSection = document.querySelector('section.progress');
  const recordBtn = document.querySelector('.record');
  const restartAndInstallUpdateBtn = document.querySelector('.restart-and-install-update');
  const toggleAudioRecordBtn = document.querySelector('.js-toggle-audio-record');
  const swapBtn = document.querySelector('.swap-btn');
  const titleBar = document.querySelector('.title-bar');
  const trafficLightsWrapper = document.querySelector('.title-bar__controls');
  const trayTriangle = document.querySelector('.tray-arrow');
  const updateNotification = document.querySelector('.update-notification');
  const windowTitle = document.querySelector('.window__title');
  const windowHeader = document.querySelector('.window-header');

  const [micOnIcon, micOffIcon] = toggleAudioRecordBtn.children;

  // Initial variables
  let monitoringIntervalId;
  let lastValidInputWidth = 512;
  let lastValidInputHeight = 512;
  let aspectRatioBaseValues = [lastValidInputWidth, lastValidInputHeight];
  let hasUpdateNotification = false;

  // Init dynamic elements
  if (app.kap.settings.get('recordAudio') === true) {
    toggleAudioRecordBtn.classList.add('is-active');
    micOnIcon.classList.remove('hidden');
    micOffIcon.classList.add('hidden');
  }

  handleTrafficLightsClicks({hide: true});

  function startMonitoringElapsedTimeAndSize() {
    const startedAt = moment();

    monitoringIntervalId = setInterval(() => {
      // TODO: split this into two intervals: one for time (1000ms)
      // and one for size (500ms)
      const now = moment();

      const elapsed = moment.utc(now.diff(startedAt)).format('mm:ss');
      windowTitle.innerText = elapsed;
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
    setMainWindowTitle('Getting ready…');
    const past = Date.now();

    const cropperBounds = app.kap.getCropperWindow().getBounds();
    const display = remote.screen.getDisplayMatching(cropperBounds);

    if (display.id === remote.screen.getPrimaryDisplay().id) {
      // Convert the coordinates to cartesian coordinates, which are used by CoreMedia
      cropperBounds.y = screen.height - (cropperBounds.y + cropperBounds.height);
    } else {
      // If the cropper window is placed in a display that it's not the main one,
      // we need to do tome _special_ math to calculate its position
      const displayBounds = display.bounds;

      // When there are more than one display, the bounds that macOS returns for a display
      // that is not the main one are relative to the main display. consequently, the
      // bounds of windows in that display are relative to the main display.
      // we need to make those bounds relative to the display in which the cropper window
      // is placed in order to aperture to work properly
      cropperBounds.x = Math.abs(displayBounds.x - cropperBounds.x);
      cropperBounds.y = Math.abs(displayBounds.y - cropperBounds.y);

      // Convert the coordinates to cartesian coordinates, which are used by CoreMedia
      cropperBounds.y = displayBounds.height - (cropperBounds.y + cropperBounds.height);
    }

    // The dashed border is 1px wide
    cropperBounds.x += 1;
    cropperBounds.y += 1;
    cropperBounds.width -= 2;
    cropperBounds.height -= 2;

    // We need the most recent settings
    const {
      fps,
      showCursor,
      highlightClicks,
      recordAudio,
      audioInputDeviceId
    } = app.kap.settings.getAll();

    const apertureOpts = {
      fps,
      cropArea: cropperBounds,
      showCursor,
      highlightClicks,
      displayId: display.id
    };

    if (recordAudio === true) {
      apertureOpts.audioSourceId = audioInputDeviceId;
    }

    aperture.startRecording(apertureOpts)
      .then(filePath => {
        recordBtn.attributes['data-state'].value = 'ready-to-stop';
        windowHeader.classList.add('has-hidden-background');
        controls.classList.add('hidden');
        startBarOptions.classList.add('hidden');
        mainBody.classList.add('is-recording');
        setMainWindowSize();
        recordBtn.classList.add('is-recording'); // Stop btn
        startMonitoringElapsedTimeAndSize(filePath);
        setMainWindowTitle('Recording');
        ipcRenderer.send('started-recording');
        log(`Started recording after ${(Date.now() - past) / 1000}s`);
      })
      .catch(err => {
        ipcRenderer.send('will-stop-recording');
        reportError(err);
        remote.dialog.showErrorBox('Recording error', err.message);
      });
  }

  function restoreInputs() {
    recordBtn.attributes['data-state'].value = 'initial';
    recordBtn.classList.remove('is-recording'); // Crop btn
    enableInputs();
  }

  function stopRecording() {
    ipcRenderer.send('will-stop-recording');
    stopMonitoring();
    aperture.stopRecording()
      .then(filePath => {
        ipcRenderer.send('stopped-recording');
        windowTitle.innerText = 'Kap';
        ipcRenderer.send('open-editor-window', {filePath});
        windowHeader.classList.remove('has-hidden-background');
        mainBody.classList.remove('is-recording');
        controls.classList.remove('hidden');
        startBarOptions.classList.remove('hidden');
        setMainWindowSize();
        restoreInputs();
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
      recordBtn.classList.add('is-cropping');
      recordBtn.attributes['data-state'].value = 'ready-to-record';
    } else if (state === 'ready-to-record') {
      startRecording();
    } else if (state === 'ready-to-stop') {
      stopRecording();
    }
  }

  recordBtn.onclick = function () {
    if (app.kap.editorWindow) {
      // We need to keep the window visible to show the shake animation
      // (it'll be auto hidden by `menubar` when the editor window gain focus)
      ipcRenderer.send('set-main-window-visibility', {
        alwaysOnTop: true,
        temporary: true,
        forHowLong: 1000
      });
      shake(this);
      ipcRenderer.send('open-editor-window', {notify: true});
    } else {
      prepareRecordButton();
    }
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
    this.value = this.value || (shake(this) && 512); // Prevent the input from staying empty
  };

  inputHeight.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputHeight,
      empty: true,
      max: screen.height - screen.availTop, // Currently we can't draw over the menubar
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
    this.value = this.value || (shake(this) && 512); // Prevent the input from staying empty
  };

  options.onclick = event => {
    const {bottom, left} = options.getBoundingClientRect();
    ipcRenderer.send('show-options-menu', {x: left, y: bottom});
    event.stopPropagation();
  };

  swapBtn.onclick = () => {
    [inputWidth.value, inputHeight.value] = [inputHeight.value, inputWidth.value];
    inputWidth.oninput();
    inputHeight.oninput();
  };

  linkBtn.onclick = function () {
    this.classList.toggle('is-active');
  };

  aspectRatioSelector.onchange = function () {
    const values = this.value.split('x');
    if (values.length === 2) {
      [inputWidth.value, inputHeight.value] = values;
      aspectRatioBaseValues = values;
      setCropperWindowSize(...values);
    }
  };

  toggleAudioRecordBtn.onclick = function () {
    micOnIcon.classList.toggle('hidden');
    micOffIcon.classList.toggle('hidden');
    this.classList.toggle('is-active');

    app.kap.settings.set('recordAudio', isVisible(micOnIcon));
  };

  observersToDispose.push(app.kap.settings.observe('recordAudio', event => {
    const method = event.newValue ? 'add' : 'remove';
    toggleAudioRecordBtn.classList[method]('is-active');
    if (event.newValue === true) {
      micOnIcon.classList.remove('hidden');
      micOffIcon.classList.add('hidden');
    } else {
      micOnIcon.classList.add('hidden');
      micOffIcon.classList.remove('hidden');
    }
  }));

  ipcRenderer.on('start-recording', () => startRecording());

  ipcRenderer.on('prepare-recording', () => prepareRecordButton());

  ipcRenderer.on('cropper-window-closed', () => {
    recordBtn.classList.remove('is-cropping');
    recordBtn.attributes['data-state'].value = 'initial';
  });

  ipcRenderer.on('cropper-window-new-size', (event, size) => {
    if (inputWidth !== document.activeElement && inputHeight !== document.activeElement) {
      [inputWidth.value, inputHeight.value] = [size.width, size.height];
    }
  });

  function setTrayTriangleVisible(visible = true) {
    const color = hasUpdateNotification ? '#28CA42' : 'white';
    trayTriangle.style.borderBottomWidth = visible ? '1rem' : '0';
    trayTriangle.style.borderBottomColor = visible ? color : 'white';

    const bodyClasses = document.body.classList;
    if (visible) {
      bodyClasses.remove('is-tray-arrow-hidden');
    } else {
      bodyClasses.add('is-tray-arrow-hidden');
    }
  }

  ipcRenderer.on('unstick-from-menubar', () => {
    setTrayTriangleVisible(false);
    trafficLightsWrapper.classList.remove('is-invisible');
    windowHeader.classList.remove('is-hidden');
    setMainWindowSize();
  });

  ipcRenderer.on('stick-to-menubar', () => {
    setTrayTriangleVisible();
    trafficLightsWrapper.classList.add('is-invisible');
    windowHeader.classList.add('is-hidden');
    setMainWindowSize();
  });

  ipcRenderer.on('stop-recording', stopRecording);

  ipcRenderer.on('update-downloaded', () => {
    const title = 'An update is available 🎉';
    const body = 'Click here to install it 😊';

    hasUpdateNotification = true;
    titleBar.classList.add('has-update-notification');
    updateNotification.classList.remove('hidden');

    // If the traffic lights are invisible, the triangle should be visible
    // if they are visible, the tray triangle should be invisible
    setTrayTriangleVisible(isVisible(trafficLightsWrapper)); // To update the color

    setMainWindowSize();

    openReleaseNotesBtn.onclick = () => shell.openExternal('https://github.com/wulkano/kap/releases/latest');
    restartAndInstallUpdateBtn.onclick = () => ipcRenderer.send('install-update');

    const notification = new Notification(title, {body});
    notification.onclick = () => ipcRenderer.send('install-update');
  });

  ipcRenderer.on('log', (event, msgs) => console.log(...msgs));

  function showExportWindow() {
    startBar.classList.add('hidden');
    controls.classList.add('hidden');
    progressBarSection.classList.remove('hidden');
    setMainWindowSize();
    app.kap.mainWindow.show();
  }

  function hideExportWindow() {
    app.kap.mainWindow.hide();
    setMainWindowSize();
    progressBarSection.classList.add('hidden');
    startBar.classList.remove('hidden');
    controls.classList.remove('hidden');
    delete progressBar.value;
    progressBarLabel.innerText = 'Analyzing…';
    setMainWindowSize();
  }

  ipcRenderer.on('start-export', () => {
    showExportWindow();
  });

  ipcRenderer.on('export-progress', (event, data) => {
    progressBarLabel.innerText = data.text;

    if (data.percentage) {
      progressBar.value = data.percentage * 100;
    } else {
      // TODO: How do I get the indeterminate progress bar?
      progressBar.value = 0;
    }
  });

  ipcRenderer.on('hide-export-window', () => {
    hideExportWindow();
  });

  ipcRenderer.on('end-export', () => {
    progressBarLabel.innerText = 'Success 🎉'; // TODO: What should it say here?
    progressBar.value = 100;
    setTimeout(hideExportWindow, 1000);
  });

  initErrorReporter();
});

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

window.addEventListener('load', setMainWindowSize);
window.addEventListener('beforeunload', () => {
  disposeObservers(observersToDispose);
});
