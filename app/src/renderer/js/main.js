import {ipcRenderer, remote} from 'electron';
import EventEmitter from 'events';

import {init as initErrorReporter, report as reportError} from '../../common/reporter';
import {log} from '../../common/logger';

// Note: `./` == `/app/dist/renderer/views`, not `js`
import {handleKeyDown, validateNumericInput} from '../js/input-utils';
import {handleTrafficLightsClicks, isVisible, disposeObservers} from '../js/utils';
import buildSizeMenu, {findRatioForSize} from '../js/size-selector';

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
  const ratioSelector = document.querySelector('.ratio-selector');
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

  // Initial variables
  const dimensions = app.kap.settings.get('dimensions');
  const {width, height, ratioLocked} = dimensions;
  const dimensionsEmitter = new EventEmitter();
  let lastValidInputWidth = width;
  let lastValidInputHeight = height;

  // Init dynamic elements
  if (app.kap.settings.get('recordAudio') === true) {
    toggleAudioRecordBtn.classList.add('is-active');
    micOnIcon.classList.remove('hidden');
    micOffIcon.classList.add('hidden');
  }

  // Set initial values
  inputWidth.value = Math.round(width);
  inputHeight.value = Math.round(height);
  setSelectedRatio(width, height);
  if (ratioLocked === true) {
    linkBtn.classList.toggle('is-active');
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

  function setSelectedRatio(width, height) {
    // The width and height inputs are not producing whole numbers
    // sometimes they put out strings, sometimes floats and sometimes ints.
    // parseInt is used here so the ratio calculation doesn't die.
    width = parseInt(width, 10);
    height = parseInt(height, 10);
    dimensions.ratio = findRatioForSize(width, height);

    // Remove pid from dimensions object
    // since size is being set manually
    if (dimensions.app && (dimensions.app.width !== width || dimensions.app.height !== height)) {
      dimensions.app = null;
    }

    dimensionsEmitter.emit('change', dimensions);
    app.kap.settings.set('dimensions', dimensions);
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
    const [first, second] = dimensions.ratio;

    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputWidth,
      empty: !validate,
      max: screen.width,
      min: (validate && dimensions.ratioLocked) ? first : 1,
      onInvalid: shake
    });

    dimensions.width = this.value;
    app.kap.settings.set('dimensions', dimensions);

    if (dimensions.ratioLocked) {
      dimensions.height = (second / first) * this.value;
      app.kap.settings.set('dimensions', dimensions);
      inputHeight.value = Math.round(dimensions.height);
      return;
    }

    setSelectedRatio(dimensions.width, dimensions.height);

    lastValidInputWidth = this.value || lastValidInputWidth;
    setCropperWindowSize();
  }

  function handleHeightInput(event, validate) {
    const [first, second] = dimensions.ratio;

    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputHeight,
      empty: !validate,
      max: screen.height - screen.availTop, // Currently we can't draw over the menubar
      min: (validate && dimensions.ratioLocked) ? second : 1,
      onInvalid: shake
    });

    dimensions.height = this.value;
    app.kap.settings.set('dimensions', dimensions);

    if (dimensions.ratioLocked) {
      dimensions.width = (first / second) * this.value;
      app.kap.settings.set('dimensions', dimensions);
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
    dimensions.ratio = dimensions.ratio.reverse();
    inputWidth.oninput();
    inputHeight.oninput();
    setSelectedRatio(dimensions.width, dimensions.height);
    app.kap.settings.set('dimensions', dimensions);
  };

  linkBtn.onclick = function () {
    this.classList.toggle('is-active');
    dimensions.ratioLocked = !dimensions.ratioLocked;
    app.kap.settings.set('dimensions', dimensions);
  };

  const handleSizeChange = function (ratio) {
    dimensions.ratio = [parseInt(ratio.split(':')[0], 10), parseInt(ratio.split(':')[1], 10)];

    dimensions.ratioLocked = true;
    linkBtn.classList.add('is-active');

    if (dimensions.ratioLocked) {
      dimensions.height = (dimensions.ratio[1] / dimensions.ratio[0]) * dimensions.width;
      inputHeight.value = Math.round(dimensions.height);
    }
    dimensionsEmitter.emit('change', dimensions);
    app.kap.settings.set('dimensions', dimensions);
  };

  ipcRenderer.on('change-aspect-ratio', (e, aspectRatio) => handleSizeChange(aspectRatio));

  dimensionsEmitter.on('ratio-selected', ratio => handleSizeChange(ratio));

  dimensionsEmitter.on('app-selected', app => {
    // Set app information on dimensions so it can be reused later
    // eg. for showing app name after selection
    dimensions.app = {
      pid: app.pid,
      width: app.width,
      height: app.height
    };

    if (app.pid < 0) {
      // Fullscreen
      ipcRenderer.send('open-cropper-window', {width: app.width, height: app.height}, {x: 1, y: 1});
    } else {
      ipcRenderer.send('activate-app', app.ownerName, app);
    }
  });

  buildSizeMenu({
    el: ratioSelector,
    emitter: dimensionsEmitter,
    dimensions
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

    console.log('GOT BOUNDS', bounds);

    [inputWidth.value, inputHeight.value] = [bounds.width, bounds.height];
    setSelectedRatio(bounds.width, bounds.height);
  });

  ipcRenderer.on('cropper-window-new-size', (event, size) => {
    if (inputWidth !== document.activeElement && inputHeight !== document.activeElement) {
      [inputWidth.value, inputHeight.value] = [size.width, size.height];
      setSelectedRatio(size.width, size.height);
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
