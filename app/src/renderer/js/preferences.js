import {remote} from 'electron';

// note: `./` == `/app/dist/renderer/views`, not `js`
import {handleTrafficLightsClicks, $} from '../js/utils';

const {app, dialog, getCurrentWindow} = remote;

const settingsValues = app.kap.settings.getAll();

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const advancedPrefs = $('.advanced-prefs');
  const advancedPrefsBtn = $('.show-advanced-prefs');
  const allowAnalyticsCheckbox = $('#allow-analytics');
  const chooseSaveDirectoryBtn = $('.js-choose-save');
  const enableSoundCheckbox = $('#enable-sound');
  const fpsLabel = $('.js-current-fps');
  const fpsSlider = $('.fps-slider');
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
  highlightClicksCheckbox.checked = settingsValues.highlightClicks;
  fpsSlider.value = settingsValues.fps;
  fpsLabel.innerText = `${settingsValues.fps} FPS`;
  enableSoundCheckbox.checked = settingsValues.sound;

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

  enableSoundCheckbox.onchange = function () {
    app.kap.settings.set('sound', this.checked);
  };
});
