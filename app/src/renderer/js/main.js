import {ipcRenderer, remote} from 'electron';
import {getWindows} from 'mac-windows';

import {init as initErrorReporter, report as reportError} from '../../common/reporter';
import {log} from '../../common/logger';

// Note: `./` == `/app/dist/renderer/views`, not `js`
import {handleKeyDown, validateNumericInput} from '../js/input-utils';
import {handleTrafficLightsClicks, isVisible, disposeObservers} from '../js/utils';

const aperture = require('aperture')();

const {app} = remote;

// Observers that should be disposed when the window unloads
const observersToDispose = [];

const cropperWindowBuffer = 2;

function setMainWindowSize() {
  const width = document.documentElement.scrollWidth;
  const height = document.documentElement.scrollHeight;
  ipcRenderer.send('set-main-window-size', {width, height});
}

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const aspectRatioSelector = document.querySelector('.aspect-ratio-selector');
  const appSelector = document.querySelector('.app-selector');
  const disabledAppOption = appSelector.querySelector('option[disabled]');
  const startBar = document.querySelector('.start-bar');
  const controls = document.querySelector('.controls-content');
  const inputWidth = document.querySelector('#aspect-ratio-width');
  const inputHeight = document.querySelector('#aspect-ratio-height');
  const linkBtn = document.querySelector('.link-btn');
  const options = document.querySelector('.controls-options');
  const progressBar = document.querySelector('#progress-bar');
  const progressBarLabel = document.querySelector('.progress-bar-label');
  const progressBarSection = document.querySelector('section.progress');
  const recordBtn = document.querySelector('.record');
  const toggleAudioRecordBtn = document.querySelector('.js-toggle-audio-record');
  const swapBtn = document.querySelector('.swap-btn');
  const trafficLightsWrapper = document.querySelector('.title-bar__controls');
  const trayTriangle = document.querySelector('.tray-arrow');
  const windowHeader = document.querySelector('.window-header');

  const [micOnIcon, micOffIcon] = toggleAudioRecordBtn.children;

  const createOption = (label, {disabled = false} = {}) => {
    const option = document.createElement('option');
    option.value = label;
    option.text = label;
    option.disabled = disabled;
    return option;
  };

  const appData = {
    Fullscreen: remote.screen.getPrimaryDisplay().bounds
  };

  function handleAppChange() {
    const app = this.value;

    if (!app) {
      return;
    }

    if (app === 'Fullscreen') {
      let {width, height} = appData[app];
      // Need to get rid of the buffer because window can't be outside the screen limits
      width -= cropperWindowBuffer;
      height -= cropperWindowBuffer;
      ipcRenderer.send('open-cropper-window', {width, height}, {x: 1, y: 1});
    } else {
      ipcRenderer.send('activate-application', app, appData[app]);
    }
  }

  function clearApp() {
    disabledAppOption.selected = true;
  }

  appSelector.append(createOption('Fullscreen'));
  appSelector.append(createOption('──────────', {disabled: true}));
  appSelector.addEventListener('change', handleAppChange);

  async function loadApps() {
    // Remove existing applications
    const options = appSelector.querySelectorAll('option:not([disabled])');
    for (const option of options) {
      if (option.value !== 'Fullscreen') {
        option.remove();
        delete appData[option.value];
      }
    }

    disabledAppOption.text = 'Loading…';
    disabledAppOption.selected = true;

    // Load applications
    const windows = await getWindows();
    disabledAppOption.text = 'Select…';
    for (const window of windows) {
      if (window.name !== 'Kap') {
        appData[window.ownerName] = window;
        appSelector.append(createOption(window.ownerName));
      }
    }
  }

  loadApps();

  // Initial variables
  let lastValidInputWidth = 512;
  let lastValidInputHeight = 512;
  const dimensions = {
    height: 512,
    width: 512,
    ratio: '1:1',
    ratioLocked: false
  };

  // Init dynamic elements
  if (app.kap.settings.get('recordAudio') === true) {
    toggleAudioRecordBtn.classList.add('is-active');
    micOnIcon.classList.remove('hidden');
    micOffIcon.classList.add('hidden');
  }

  handleTrafficLightsClicks({hide: true});

  async function startRecording() {
    ipcRenderer.send('will-start-recording');

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
      // We have to convert this to a number as there was a bug
      // previously that set FPS to string in the preferences
      fps: Number(fps),

      cropArea: cropperBounds,
      showCursor,
      highlightClicks,
      displayId: String(display.id)
    };

    if (recordAudio === true) {
      apertureOpts.audioDeviceId = audioInputDeviceId;
    }

    try {
      await aperture.startRecording(apertureOpts);
      log(`Started recording after ${(Date.now() - past) / 1000}s`);
    } catch (err) {
      // This prevents the button from being reset, since the recording has not yet started
      // This delay is due to internal framework delays in aperture native code
      if (err.message.includes('stopRecording')) {
        log(`Recording not yet started, can't stop recording before it actually started`);
        return;
      }

      ipcRenderer.send('will-stop-recording');
      reportError(err);
      remote.dialog.showErrorBox('Recording error', err.message);
    }
  }

  async function stopRecording() {
    clearApp();
    ipcRenderer.send('will-stop-recording');

    const filePath = await aperture.stopRecording();
    ipcRenderer.send('stopped-recording');
    ipcRenderer.send('open-editor-window', {filePath});
    setMainWindowSize();
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
    const state = recordBtn.dataset.state;
    if (state === 'initial') {
      ipcRenderer.send('open-cropper-window', {
        width: parseInt(inputWidth.value, 10),
        height: parseInt(inputHeight.value, 10)
      });
    } else if (state === 'ready-to-record') {
      startRecording();
    } else if (state === 'ready-to-stop') {
      stopRecording();
    }
  }

  // Helper function for retrieving the simplest ratio, via the largest common divisor of two numbers (thanks @doot0)
  function getLargestCommonDivisor(first, second) {
    if (!first) {
      return 1;
    }

    if (!second) {
      return first;
    }

    return getLargestCommonDivisor(second, first % second);
  }

  function getSimplestRatio(width, height) {
    const lcd = getLargestCommonDivisor(width, height);
    const denominator = width / lcd;
    const numerator = height / lcd;
    return `${denominator}:${numerator}`;
  }

  function setSelectedRatio(width, height) {
    dimensions.ratio = getSimplestRatio(width, height);

    const ratios = document.querySelectorAll('.aspect-ratio-selector option');
    let hadMatch = false;
    for (const ratio of ratios) {
      if (ratio.value === dimensions.ratio) {
        aspectRatioSelector.value = dimensions.ratio;
        hadMatch = true;
        break;
      }
    }

    if (!hadMatch) {
      const customRatio = document.querySelector('#custom-ratio-option');
      customRatio.value = dimensions.ratio;
      customRatio.textContent = `Custom (${dimensions.ratio})`;
      customRatio.selected = true;
    }
  }

  const handleRecord = function () {
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

  recordBtn.addEventListener('click', handleRecord);
  ipcRenderer.on('record', handleRecord);
  ipcRenderer.on('crop', handleRecord);

  function setCropperWindowSize(width, height) {
    ipcRenderer.send('set-cropper-window-size', {
      width: width || lastValidInputWidth,
      height: height || lastValidInputHeight
    });
  }

  function handleWidthInput(event, validate) {
    clearApp();
    const [first, second] = dimensions.ratio.split(':');

    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputWidth,
      empty: !validate,
      max: screen.width,
      min: (validate && dimensions.ratioLocked) ? first : 1,
      onInvalid: shake
    });

    dimensions.width = this.value;

    if (dimensions.ratioLocked) {
      dimensions.height = (second / first) * this.value;
      inputHeight.value = Math.round(dimensions.height);
      return;
    }

    setSelectedRatio(dimensions.width, dimensions.height);

    lastValidInputWidth = this.value || lastValidInputWidth;
    setCropperWindowSize();
  }

  function handleHeightInput(event, validate) {
    clearApp();
    const [first, second] = dimensions.ratio.split(':');

    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputHeight,
      empty: !validate,
      max: screen.height - screen.availTop, // Currently we can't draw over the menubar
      min: (validate && dimensions.ratioLocked) ? second : 1,
      onInvalid: shake
    });

    dimensions.height = this.value;

    if (dimensions.ratioLocked) {
      dimensions.width = (first / second) * this.value;
      inputWidth.value = Math.round(dimensions.width);
      return;
    }

    setSelectedRatio(dimensions.width, dimensions.height);

    lastValidInputHeight = this.value || lastValidInputHeight;
    setCropperWindowSize();
  }

  inputWidth.oninput = handleWidthInput;
  inputWidth.onchange = handleWidthInput.bind(inputWidth, null, true);
  inputWidth.onkeydown = handleKeyDown;
  inputWidth.onblur = function () {
    this.value = this.value || (shake(this) && lastValidInputWidth); // Prevent the input from staying empty
  };

  inputHeight.oninput = handleHeightInput;
  inputHeight.onchange = handleHeightInput.bind(inputHeight, null, true);
  inputHeight.onkeydown = handleKeyDown;
  inputHeight.onblur = function () {
    this.value = this.value || (shake(this) && lastValidInputHeight); // Prevent the input from staying empty
  };

  options.onclick = event => {
    const {bottom, left} = options.getBoundingClientRect();
    ipcRenderer.send('show-options-menu', {x: left, y: bottom});
    event.stopPropagation();
  };

  swapBtn.onclick = () => {
    [inputWidth.value, inputHeight.value] = [inputHeight.value, inputWidth.value];
    dimensions.ratio = `${dimensions.ratio.split(':')[1]}: ${dimensions.ratio.split(':')[0]}`;
    inputWidth.oninput();
    inputHeight.oninput();
    setSelectedRatio(dimensions.width, dimensions.height);
  };

  linkBtn.onclick = function () {
    this.classList.toggle('is-active');
    dimensions.ratioLocked = !dimensions.ratioLocked;
  };

  const handleSizeChange = function () {
    clearApp();
    dimensions.ratio = this.value;

    dimensions.ratioLocked = true;
    linkBtn.classList.add('is-active');

    if (dimensions.ratioLocked) {
      dimensions.height = (dimensions.ratio.split(':')[1] / dimensions.ratio.split(':')[0]) * dimensions.width;
      inputHeight.value = Math.round(dimensions.height);
    }
  };

  aspectRatioSelector.addEventListener('change', handleSizeChange);

  ipcRenderer.on('change-aspect-ratio', (e, aspectRatio) => {
    aspectRatioSelector.value = aspectRatio;
    handleSizeChange.call(aspectRatioSelector);
  });

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
    recordBtn.dataset.state = 'initial';
  });

  ipcRenderer.on('cropper-window-opened', (event, bounds) => {
    recordBtn.classList.add('is-cropping');
    recordBtn.dataset.state = 'ready-to-record';

    [inputWidth.value, inputHeight.value] = [bounds.width, bounds.height];
    setSelectedRatio(bounds.width, bounds.height);
  });

  ipcRenderer.on('cropper-window-new-size', (event, size) => {
    if (inputWidth !== document.activeElement && inputHeight !== document.activeElement) {
      [inputWidth.value, inputHeight.value] = [size.width, size.height];
      clearApp();
    }
  });

  function setTrayTriangleVisible(visible = true) {
    trayTriangle.style.borderBottomWidth = visible ? '1rem' : '0';
    trayTriangle.style.borderBottomColor = 'white';

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

  ipcRenderer.on('log', (event, msgs) => console.log(...msgs));

  ipcRenderer.on('load-apps', loadApps);

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
