import {remote} from 'electron';

// note: `./` == `/app/dist/renderer/views`, not `js`
import {handleTrafficLightsClicks, $, disposeObservers} from '../js/utils';

const {app, dialog, getCurrentWindow} = remote;

const settingsValues = app.kap.settings.getAll();

// observers that should be disposed when the window unloads
const observersToDispose = [];

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const advancedPrefs = $('.advanced-prefs');
  const advancedPrefsBtn = $('.show-advanced-prefs');
  const allowAnalyticsCheckbox = $('#allow-analytics');
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

  // init the shown settings
  saveToDescription.dataset.fullPath = settingsValues.kapturesDir;
  saveToDescription.setAttribute('title', settingsValues.kapturesDir);
  saveToDescription.innerText = `.../${settingsValues.kapturesDir.split('/').pop()}`;
  openOnStartupCheckbox.checked = settingsValues.openOnStartup;
  allowAnalyticsCheckbox.checked = settingsValues.allowAnalytics;
  showCursorCheckbox.checked = settingsValues.showCursor;
  if (settingsValues.showCursor === false) {
    highlightClicksCheckbox.disabled = true;
  }
  highlightClicksCheckbox.checked = settingsValues.highlightClicks;
  fpsSlider.value = settingsValues.fps;
  fpsLabel.innerText = `${settingsValues.fps} FPS`;

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
    const directories = dialog.showOpenDialog(electronWindow, {properties: ['openDirectory']});
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
    } else {
      highlightClicksCheckbox.disabled = true;
      highlightClicksCheckbox.checked = false;
      app.kap.settings.set('highlightClicks', false);
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

  // the `showCursor` setting can be changed via the
  // mouse btn in the main window
  observersToDispose.push(app.kap.settings.observe('showCursor', event => {
    showCursorCheckbox.checked = event.newValue;
    showCursorCheckbox.onchange();
  }));
});

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

window.addEventListener('beforeunload', () => {
  disposeObservers(observersToDispose);
});
