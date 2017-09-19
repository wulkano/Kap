import {remote, shell} from 'electron';
import _ from 'lodash';
import $j from 'jquery/dist/jquery.slim';

// Note: `./` == `/app/dist/renderer/views`, not `js`
import {handleTrafficLightsClicks, $, disposeObservers} from '../js/utils';

const {app, dialog, getCurrentWindow} = remote;

const aperture = require('aperture')();

const plugins = remote.require('../main/plugins').default;

const settingsValues = app.kap.settings.getAll();

// Observers that should be disposed when the window unloads
const observersToDispose = [];

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const allowAnalyticsCheckbox = $('#allow-analytics');
  const audioInputDeviceSelector = $('.js-audio-input-device-selector');
  const chooseSaveDirectoryBtn = $('.js-choose-save');
  const fpsLabel = $('.fps-slider .js-middle-label');
  const fpsSlider = $('.fps-slider input');
  const header = $('header');
  const highlightClicksCheckbox = $('#highlight-clicks');
  const openOnStartupCheckbox = $('#open-on-startup');
  const saveToDescription = $('.js-save-to-description');
  const showCursorCheckbox = $('#show-cursor');
  const openPluginsFolder = $('.js-open-plugins');

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

  const tabs = $j('.prefs-nav > a');
  tabs.on('click', function (event) {
    event.preventDefault();
    tabs.removeClass('is-active');
    $j(this).addClass('is-active');

    const panes = $j('.prefs-sections > section');
    const paneName = $j(this).data('pane');
    panes.addClass('hidden');
    panes.filter(`[data-pane="${paneName}"]`).removeClass('hidden');
  });

  // TODO: DRY up the plugin list code when it's more mature
  function loadInstalledPlugins() {
    const template = `
      <% _.forEach(plugins, plugin => { %>
        <div class="preference container">
          <div class="preference-part">
            <div class="preference-content">
              <div class="preference__title">
                <a class="preference__url o-link" href data-url="<%- plugin.homepage %>"><%- plugin.prettyName %></a>
                <span class="preference__note"><%- plugin.version %></span>
              </div>
              <p class="preference__description"><%- plugin.description %></p>
            </div>
            <div class="preference-input">
              <button class="button button--secondary uninstall" data-name="<%- plugin.name %>">Uninstall</button>
            </div>
          </div>
        </div>
      <% }); %>
    `;

    const compiled = _.template(template);
    const html = compiled({
      plugins: plugins.all()
    });

    $j('#plugins-installed').html(html);
  }

  async function loadAvailablePlugins() {
    const template = `
      <% _.forEach(plugins, plugin => { %>
        <div class="preference container">
          <div class="preference-part">
            <div class="preference-content">
              <div class="preference__title">
                <a class="preference__url o-link" href data-url="<%- plugin.links.homepage %>"><%- plugin.prettyName %></a>
                <span class="preference__note"><%- plugin.version %></span>
              </div>
              <p class="preference__description"><%- plugin.description %></p>
            </div>
            <div class="preference-input">
              <button class="button button--secondary install" data-name="<%- plugin.name %>">Install</button>
            </div>
          </div>
        </div>
      <% }); %>
    `;
    const compiled = _.template(template);
    const html = compiled({
      plugins: await plugins.getFromNpm()
    });

    $j('#plugins-available').html(html);
  }

  $j('#plugins-installed').on('click', '.uninstall', function () {
    $j(this).prop('disabled', true).text('Uninstalling…');
    const name = $j(this).data('name');

    (async () => {
      await plugins.uninstall(name);
      await loadAvailablePlugins();
      loadInstalledPlugins();
    })().catch(console.error);
  });

  $j('#plugins-available').on('click', '.install', function () {
    $j(this).prop('disabled', true).text('Installing…');
    const name = $j(this).data('name');

    (async () => {
      await plugins.install(name);
      $j(this).parents('li').remove(); // We don't want to wait on `loadAvailablePlugins`
      loadInstalledPlugins();
      await loadAvailablePlugins();
    })().catch(console.error);
  });

  // Open plugin homepage
  $j('.plugins-prefs').on('click', '.preference__url', function (event) {
    event.preventDefault();
    const url = $j(this).data('url');
    shell.openExternal(url);
  });

  loadInstalledPlugins();
  loadAvailablePlugins();

  chooseSaveDirectoryBtn.onclick = function () {
    const directories = dialog.showOpenDialog(electronWindow, {properties: ['openDirectory', 'createDirectory']});
    if (directories) {
      app.kap.settings.set('kapturesDir', directories[0]);
      saveToDescription.dataset.fullPath = directories[0];
      saveToDescription.innerText = `.../${directories[0].split('/').pop()}`;
    }
  };

  openPluginsFolder.onclick = function (event) {
    event.preventDefault();
    // The `shell.openItem(plugins.cwd);` method doesn't focus Finder
    // See: https://github.com/electron/electron/issues/10477
    // We work around it with:
    shell.openExternal(encodeURI(`file://${plugins.cwd}`));
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
