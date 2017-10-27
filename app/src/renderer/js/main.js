import {ipcRenderer, remote, shell} from 'electron';

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
  const aspectRatioSelector = document.querySelector('.aspect-ratio-selector');
  const startBar = document.querySelector('.start-bar');
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
  const windowHeader = document.querySelector('.window-header');

  const [micOnIcon, micOffIcon] = toggleAudioRecordBtn.children;

  // Initial variables
  let lastValidInputWidth = 512;
  let lastValidInputHeight = 512;
  let hasUpdateNotification = false;
  let height = 512;
  let width = 512;
  let selectedRatio = '1:1';
  let lockedRatio = false;

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

  // Helper function for retrieving the simplest ratio, via the largest common divisor of two numbers (thanks @doot0)
  function getLargestCommonDivisor(first, second) {
    return (second === 0) ? first : getLargestCommonDivisor(second, first % second);
  }

  function getSimplestRatio(width, height) {
    const lcd = getLargestCommonDivisor(width, height);
    const denominator = width / lcd;
    const numerator = height / lcd;
    return `${denominator}:${numerator}`;
  }

  function setSelectedRatio(width, height) {
    selectedRatio = getSimplestRatio(width, height);

    const ratios = document.querySelectorAll('.aspect-ratio-selector option');
    let hadMatch = false;
    for (const ratio of ratios) {
      if (ratio.value === selectedRatio) {
        aspectRatioSelector.value = selectedRatio;
        hadMatch = true;
        break;
      }
    }

    if (!hadMatch) {
      const customRatio = document.querySelector('#custom-ratio-option');
      customRatio.value = selectedRatio;
      customRatio.innerHTML = `Custom (${selectedRatio})`;
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

  inputWidth.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputWidth,
      empty: true,
      max: screen.width,
      min: 1,
      onInvalid: shake
    });

    width = this.value;

    if (lockedRatio) {
      height = (selectedRatio.split(':')[1] / selectedRatio.split(':')[0]) * this.value;
      inputHeight.value = Math.round(height);
      return;
    }

    setSelectedRatio(width, height);

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

    height = this.value;

    if (lockedRatio) {
      width = (selectedRatio.split(':')[0] / selectedRatio.split(':')[1]) * this.value;
      inputWidth.value = Math.round(width);
      return;
    }

    setSelectedRatio(width, height);

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
    lockedRatio = !lockedRatio;
  };

  const handleSizeChange = function () {
    selectedRatio = this.value;

    lockedRatio = true;
    linkBtn.classList.add('is-active');

    if (lockedRatio) {
      height = (selectedRatio.split(':')[1] / selectedRatio.split(':')[0]) * width;
      inputHeight.value = Math.round(height);
    }
  };

  aspectRatioSelector.addEventListener('change', handleSizeChange);

  ipcRenderer.on('change-size', (e, size) => {
    aspectRatioSelector.value = size;
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
