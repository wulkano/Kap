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
  const generalPrefs = $('.general-prefs');
  const generalPrefsBtn = $('.show-general-prefs');
  const header = $('header');
  const openOnStartupCheckbox = $('#open-on-startup');
  const saveToDescription = $('.js-save-to-description');

  const electronWindow = getCurrentWindow();

  electronWindow.setSheetOffset(header.offsetHeight);
  handleTrafficLightsClicks();

  // init the shown settings
  saveToDescription.dataset.fullPath = settingsValues.kapturesDir;
  saveToDescription.setAttribute('title', settingsValues.kapturesDir);
  saveToDescription.innerText = `.../${settingsValues.kapturesDir.split('/').pop()}`;
  openOnStartupCheckbox.checked = settingsValues.openOnStartup;
  allowAnalyticsCheckbox.checked = settingsValues.allowAnalytics;

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
  };

  allowAnalyticsCheckbox.onchange = function () {
    app.kap.settings.set('allowAnalytics', this.checked);
  };
});
