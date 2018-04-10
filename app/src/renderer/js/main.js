import {ipcRenderer, remote} from 'electron';
import EventEmitter from 'events';
import {default as createAperture, audioDevices} from 'aperture';
import _ from 'lodash';
import desktopIcons from 'hide-desktop-icons';
import doNotDisturb from '@sindresorhus/do-not-disturb';
import {init as initErrorReporter, report as reportError} from '../../common/reporter';
import {log} from '../../common/logger';
// Note: `./` == `/app/dist/renderer/views`, not `js`
import {handleKeyDown, validateNumericInput} from '../js/input-utils';
import {handleTrafficLightsClicks, isVisible, disposeObservers} from '../js/utils';
import buildSizeMenu, {findRatioForSize} from '../js/size-selector';

const aperture = createAperture();
const {app} = remote;

// Observers that should be disposed when the window unloads
const observersToDispose = [];

const debounceTimeout = 500;

const setMainWindowSize = () => {
  const width = document.documentElement.scrollWidth;
  const height = document.documentElement.scrollHeight;
  ipcRenderer.send('set-main-window-size', {width, height});
};

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const ratioSelector = document.querySelector('.ratio-selector');
  const inputWidth = document.querySelector('#aspect-ratio-width');
  const inputHeight = document.querySelector('#aspect-ratio-height');
  const linkBtn = document.querySelector('.link-btn');
  const options = document.querySelector('.controls-options');
  const recordBtn = document.querySelector('.record');
  const toggleAudioRecordBtn = document.querySelector('.js-toggle-audio-record');
  const swapBtn = document.querySelector('.swap-btn');
  const trafficLightsWrapper = document.querySelector('.title-bar__controls');
  const trayTriangle = document.querySelector('.tray-arrow');
  const windowHeader = document.querySelector('.window-header');

  const [micOnIcon, micOffIcon] = toggleAudioRecordBtn.children;

  // Initial variables
  const minWidth = 100;
  const minHeight = 100;
  const dimensions = app.kap.settings.get('dimensions');
  const {width, height, ratioLocked} = dimensions;
  const dimensionsEmitter = new EventEmitter();
  let lastValidInputWidth = width;
  let lastValidInputHeight = height;
  let wasDoNotDisturbAlreadyEnabled;

  // Init dynamic elements
  if (app.kap.settings.get('recordAudio') === true) {
    toggleAudioRecordBtn.classList.add('is-active');
    micOnIcon.classList.remove('hidden');
    micOffIcon.classList.add('hidden');
  }

  const shake = el => {
    el.classList.add('shake');

    el.addEventListener('webkitAnimationEnd', () => {
      el.classList.remove('shake');
    });

    return true;
  };

  const startRecording = async () => {
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

    // If we're recording fullscreen, set x, y to zero
    if (dimensions.app && dimensions.app.isFullscreen) {
      cropperBounds.x = 0;
      cropperBounds.y = 0;
    }

    // We need the most recent settings
    const {
      record60fps,
      showCursor,
      highlightClicks,
      recordAudio,
      audioInputDeviceId
    } = app.kap.settings.getAll();

    const apertureOpts = {
      fps: record60fps ? 60 : 30,
      cropArea: cropperBounds,
      showCursor,
      highlightClicks,
      displayId: String(display.id)
    };

    if (recordAudio === true) {
      // In case for some reason the default audio device is not set
      // use the first available device for recording
      if (audioInputDeviceId) {
        apertureOpts.audioDeviceId = audioInputDeviceId;
      } else {
        const [defaultAudioDevice] = await audioDevices();
        apertureOpts.audioDeviceId = defaultAudioDevice && defaultAudioDevice.id;
      }
    }

    if (app.kap.settings.get('hideDesktopIcons')) {
      await desktopIcons.hide();
    }

    if (app.kap.settings.get('doNotDisturb')) {
      wasDoNotDisturbAlreadyEnabled = await doNotDisturb.isEnabled();

      if (!wasDoNotDisturbAlreadyEnabled) {
        doNotDisturb.enable();
      }
    }

    try {
      await aperture.startRecording(apertureOpts);
      ipcRenderer.send('did-start-recording');
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
  };

  const stopRecording = async () => {
    ipcRenderer.send('will-stop-recording');

    const filePath = await aperture.stopRecording();

    if (app.kap.settings.get('hideDesktopIcons')) {
      desktopIcons.show();
    }

    if (app.kap.settings.get('doNotDisturb') && !wasDoNotDisturbAlreadyEnabled) {
      doNotDisturb.disable();
    }

    ipcRenderer.send('stopped-recording');
    ipcRenderer.send('open-editor-window', {filePath});
    setMainWindowSize();
  };

  // Prepare recording button for recording state
  // - Either opens the crop window or starts recording
  const prepareRecordButton = () => {
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
  };

  const handleRecord = event => {
    if (app.kap.editorWindow) {
      // We need to keep the window visible to show the shake animation
      // (it'll be auto hidden by `menubar` when the editor window gain focus)
      ipcRenderer.send('set-main-window-visibility', {
        alwaysOnTop: true,
        temporary: true,
        forHowLong: 1000
      });
      shake(event.currentTarget);
      ipcRenderer.send('open-editor-window', {notify: true});
    } else {
      prepareRecordButton();
    }
  };

  const setSelectedRatio = (width, height) => {
    dimensions.ratio = findRatioForSize(width, height);

    // Remove app from dimensions object
    // since size is being set manually
    if (dimensions.app && (dimensions.app.width !== width || dimensions.app.height !== height)) {
      dimensions.app = null;
    }

    dimensionsEmitter.emit('change', dimensions);
    app.kap.settings.set('dimensions', dimensions);
  };

  // Set initial values
  inputWidth.value = Math.round(width);
  inputHeight.value = Math.round(height);

  setSelectedRatio(width, height);

  if (ratioLocked === true) {
    linkBtn.classList.toggle('is-active');
  }

  handleTrafficLightsClicks({hide: true});

  recordBtn.addEventListener('click', handleRecord);
  ipcRenderer.on('record', handleRecord);
  ipcRenderer.on('crop', handleRecord);

  const setCropperWindowSize = (width, height) => {
    ipcRenderer.send('set-cropper-window-size', {
      width: width || lastValidInputWidth,
      height: height || lastValidInputHeight
    });
  };

  const handleWidthInput = (event, validate) => {
    // User is deleting the current value
    // to enter a new one
    if (!event.target.value) {
      return;
    }

    const [first, second] = dimensions.ratio;

    const min = dimensions.ratioLocked ? Math.ceil(minHeight * first / second) : minWidth;
    const max = dimensions.ratioLocked ? Math.ceil(screen.height * first / second) : screen.width;

    event.target.value = validateNumericInput(event.target, {
      lastValidValue: lastValidInputWidth,
      empty: !validate,
      max: Math.min(max, screen.width),
      min: Math.max(min, minWidth),
      onInvalid: shake
    });

    dimensions.width = parseInt(event.target.value, 10);
    app.kap.settings.set('dimensions', dimensions);
    const ignoreRatioLocked = event.detail && event.detail.ignoreRatioLocked;

    if (dimensions.ratioLocked && !ignoreRatioLocked) {
      dimensions.height = Math.round((second / first) * event.target.value);
      app.kap.settings.set('dimensions', dimensions);
      inputHeight.value = dimensions.height;
      lastValidInputHeight = dimensions.height;
    } else {
      setSelectedRatio(dimensions.width, dimensions.height);
    }

    lastValidInputWidth = event.target.value || lastValidInputWidth;
    setCropperWindowSize();
  };

  const handleHeightInput = (event, validate) => {
    // User is deleting the current value
    // to enter a new one
    if (!event.target.value) {
      return;
    }

    const [first, second] = dimensions.ratio;

    const min = dimensions.ratioLocked ? Math.ceil(minWidth * second / first) : minHeight;
    const max = dimensions.ratioLocked ? Math.ceil(screen.width * second / first) : screen.height;

    event.target.value = validateNumericInput(event.target, {
      lastValidValue: lastValidInputHeight,
      empty: !validate,
      max: Math.min(max, screen.height),
      min: Math.max(min, minHeight),
      onInvalid: shake
    });

    dimensions.height = parseInt(event.target.value, 10);
    app.kap.settings.set('dimensions', dimensions);
    const ignoreRatioLocked = event.detail && event.detail.ignoreRatioLocked;

    if (dimensions.ratioLocked && !ignoreRatioLocked) {
      dimensions.width = Math.round((first / second) * event.target.value);
      app.kap.settings.set('dimensions', dimensions);
      inputWidth.value = dimensions.width;
      lastValidInputWidth = dimensions.width;
    } else {
      setSelectedRatio(dimensions.width, dimensions.height);
    }

    lastValidInputHeight = event.target.value || lastValidInputHeight;
    setCropperWindowSize();
  };

  const inputWidthListener = _.debounce(handleWidthInput, debounceTimeout);
  const inputHeightListener = _.debounce(handleHeightInput, debounceTimeout);

  inputWidth.addEventListener('input', inputWidthListener);
  inputWidth.addEventListener('keydown', handleKeyDown);
  inputWidth.addEventListener('blur', event => {
    inputWidthListener.flush();
    event.currentTarget.value = event.currentTarget.value || (shake(event.currentTarget) && lastValidInputWidth); // Prevent the input from staying empty
  });

  inputHeight.addEventListener('input', inputHeightListener);
  inputHeight.addEventListener('keydown', handleKeyDown);
  inputHeight.addEventListener('blur', event => {
    inputHeightListener.flush();
    event.currentTarget.value = event.currentTarget.value || (shake(event.currentTarget) && lastValidInputHeight); // Prevent the input from staying empty
  });

  options.addEventListener('click', event => {
    const {bottom, left} = options.getBoundingClientRect();
    ipcRenderer.send('show-options-menu', {x: left, y: bottom});
    event.stopPropagation();
  });

  swapBtn.addEventListener('click', () => {
    [inputWidth.value, inputHeight.value] = [inputHeight.value, inputWidth.value];
    dimensions.ratio = dimensions.ratio.reverse();
    inputWidth.dispatchEvent(new CustomEvent('input', {detail: {ignoreRatioLocked: true}}));
    inputHeight.dispatchEvent(new CustomEvent('input', {detail: {ignoreRatioLocked: true}}));
    setSelectedRatio(dimensions.width, dimensions.height);
    app.kap.settings.set('dimensions', dimensions);
  });

  linkBtn.addEventListener('click', event => {
    event.currentTarget.classList.toggle('is-active');
    dimensions.ratioLocked = !dimensions.ratioLocked;
    app.kap.settings.set('dimensions', dimensions);
  });

  const handleSizeChange = ratio => {
    dimensions.app = null;
    dimensions.ratio = [parseInt(ratio.split(':')[0], 10), parseInt(ratio.split(':')[1], 10)];

    dimensions.ratioLocked = true;
    linkBtn.classList.add('is-active');

    if (dimensions.ratioLocked) {
      dimensions.height = Math.round((dimensions.ratio[1] / dimensions.ratio[0]) * dimensions.width);
      inputHeight.value = Math.round(dimensions.height);
    }

    setCropperWindowSize(dimensions.width, dimensions.height);

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
      isFullscreen: app.isFullscreen,
      width: app.width,
      height: app.height
    };

    if (app.isFullscreen) {
      // Fullscreen
      ipcRenderer.send('open-cropper-window', {width: app.width, height: app.height}, {x: 0, y: 0});
    } else {
      ipcRenderer.send('activate-app', app.ownerName, app);
    }
  });

  buildSizeMenu({
    el: ratioSelector,
    emitter: dimensionsEmitter,
    dimensions
  });

  toggleAudioRecordBtn.addEventListener('click', event => {
    micOnIcon.classList.toggle('hidden');
    micOffIcon.classList.toggle('hidden');
    event.currentTarget.classList.toggle('is-active');
    app.kap.settings.set('recordAudio', isVisible(micOnIcon));
  });

  ipcRenderer.on('start-recording', () => startRecording());
  ipcRenderer.on('prepare-recording', () => prepareRecordButton());

  ipcRenderer.on('cropper-window-closed', () => {
    recordBtn.classList.remove('is-cropping');
    recordBtn.dataset.state = 'initial';
    dimensions.app = null;
  });

  ipcRenderer.on('cropper-window-opened', (event, bounds) => {
    recordBtn.classList.add('is-cropping');
    recordBtn.dataset.state = 'ready-to-record';

    [inputWidth.value, inputHeight.value] = [bounds.width, bounds.height];
    setSelectedRatio(bounds.width, bounds.height);
  });

  ipcRenderer.on('cropper-window-new-size', (event, size) => {
    if (inputWidth !== document.activeElement && inputHeight !== document.activeElement) {
      const width = size.width - app.kap.cropperWindowBuffer;
      const height = size.height - app.kap.cropperWindowBuffer;
      [inputWidth.value, inputHeight.value] = [width, height];
      setSelectedRatio(width, height);
    }
  });

  const setTrayTriangleVisible = (visible = true) => {
    trayTriangle.style.borderBottomWidth = visible ? '1rem' : '0';
    trayTriangle.style.borderBottomColor = 'white';

    const bodyClasses = document.body.classList;

    if (visible) {
      bodyClasses.remove('is-tray-arrow-hidden');
    } else {
      bodyClasses.add('is-tray-arrow-hidden');
    }
  };

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

  initErrorReporter();
});

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());
window.addEventListener('load', setMainWindowSize);

window.addEventListener('beforeunload', () => {
  disposeObservers(observersToDispose);
});
