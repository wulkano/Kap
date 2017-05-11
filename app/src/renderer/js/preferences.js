import {remote} from 'electron';

// Note: `./` == `/app/dist/renderer/views`, not `js`
import {handleTrafficLightsClicks, $, disposeObservers} from '../js/utils';

const {app, dialog, getCurrentWindow} = remote;

const aperture = require('aperture')();

const settingsValues = app.kap.settings.getAll();

// Observers that should be disposed when the window unloads
const observersToDispose = [];

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const advancedPrefs = $('.advanced-prefs');
  const advancedPrefsBtn = $('.show-advanced-prefs');
  const allowAnalyticsCheckbox = $('#allow-analytics');
  const audioInputDeviceSelector = $('.js-audio-input-device-selector');
  const chooseSaveDirectoryBtn = $('.js-choose-save');
  const fpsLabel = $('.fps-slider .js-middle-label');
  const fpsSlider = $('.fps-slider input');
  const generalPrefs = $('.general-prefs');
  const generalPrefsBtn = $('.show-general-prefs');
  const header = $('header');
  const highlightClicksCheckbox = $('#highlight-clicks');
  const openOnStartupCheckbox = $('#open-on-startup');
  const saveToDescription = $('.js-save-to-description');
  const showCursorCheckbox = $('#show-cursor');

  const electronWindow = getCurrentWindow();

  electronWindow.setSheetOffset(header.offsetHeight);
  handleTrafficLightsClicks();

  // Init the shown settings
  saveToDescription.dataset.fullPath = settingsValues.kapturesDir;
  saveToDescription.setAttribute('title', settingsValues.kapturesDir);
  saveToDescription.innerText = `.../${settingsValues.kapturesDir.split('/').pop()}`;
  openOnStartupCheckbox.checked = settingsValues.openOnStartup;
  allowAnalyticsCheckbox.checked = settingsValues.allowAnalytics;
  showCursorCheckbox.checked = settingsValues.showCursor;
  if (settingsValues.showCursor === false) {
    highlightClicksCheckbox.disabled = true;
  } else {
    highlightClicksCheckbox.checked = settingsValues.highlightClicks;
  }
  fpsSlider.value = settingsValues.fps;
  fpsLabel.innerText = `${settingsValues.fps} FPS`;
  aperture.getAudioSources().then(devices => {
    for (const device of devices) {
      const option = document.createElement('option');
      option.value = device.id;
      option.text = device.name;
      audioInputDeviceSelector.add(option);
    }
    if (settingsValues.recordAudio === true) {
      audioInputDeviceSelector.value = settingsValues.audioInputDeviceId;
    }
  });

  generalPrefsBtn.onclick = function (e) {
    e.preventDefault();
    this.classList.add('is-active');
    advancedPrefsBtn.classList.remove('is-active');
    generalPrefs.classList.remove('hidden');
    advancedPrefs.classList.add('hidden');
  };

  advancedPrefsBtn.onclick = function (e) {
    e.preventDefault();
    this.classList.add('is-active');
    generalPrefsBtn.classList.remove('is-active');
    advancedPrefs.classList.remove('hidden');
    generalPrefs.classList.add('hidden');
  };

  chooseSaveDirectoryBtn.onclick = function () {
    const directories = dialog.showOpenDialog(electronWindow, {properties: ['openDirectory', 'createDirectory']});
    if (directories) {
      app.kap.settings.set('kapturesDir', directories[0]);
      saveToDescription.dataset.fullPath = directories[0];
      saveToDescription.innerText = `.../${directories[0].split('/').pop()}`;
    }
  };

  openOnStartupCheckbox.onchange = function () {
    app.kap.settings.set('openOnStartup', this.checked);
    app.setLoginItemSettings({openAtLogin: this.checked});
  };

  allowAnalyticsCheckbox.onchange = function () {
    app.kap.settings.set('allowAnalytics', this.checked);
  };

  showCursorCheckbox.onchange = function () {
    app.kap.settings.set('showCursor', this.checked);
    if (this.checked) {
      highlightClicksCheckbox.disabled = false;
      highlightClicksCheckbox.checked = app.kap.settings.get('highlightClicks');
    } else {
      highlightClicksCheckbox.disabled = true;
      highlightClicksCheckbox.checked = false;
    }
  };

  highlightClicksCheckbox.onchange = function () {
    app.kap.settings.set('highlightClicks', this.checked);
  };

  fpsSlider.oninput = function () {
    fpsLabel.innerText = `${this.value} FPS`;
  };

  fpsSlider.onchange = function () {
    app.kap.settings.set('fps', this.value);
  };

  audioInputDeviceSelector.onchange = function () {
    app.kap.settings.set('recordAudio', this.value !== 'none');
    if (this.value !== 'none') {
      app.kap.settings.set('audioInputDeviceId', this.value);
    }
  };

  // The `showCursor` setting can be changed via the
  // mouse btn in the main window
  observersToDispose.push(app.kap.settings.observe('showCursor', event => {
    showCursorCheckbox.checked = event.newValue;
    showCursorCheckbox.onchange();
  }));

  // The `recordAudio` setting can be changed via the
  // mic btn in the main window
  observersToDispose.push(app.kap.settings.observe('recordAudio', event => {
    if (event.newValue === true) {
      audioInputDeviceSelector.value = app.kap.settings.get('audioInputDeviceId');
    } else {
      audioInputDeviceSelector.value = 'none';
    }
  }));
});

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

window.addEventListener('beforeunload', () => {
  disposeObservers(observersToDispose);
});
