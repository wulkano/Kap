import {ipcRenderer, remote, shell} from 'electron';
import _ from 'lodash';
import $j from 'jquery/dist/jquery.slim';

// Note: `./` == `/app/dist/renderer/views`, not `js`
import {handleTrafficLightsClicks, $, disposeObservers, shortenString} from '../js/utils';

const {app, dialog, getCurrentWindow} = remote;

const aperture = require('aperture');

const plugins = remote.require('../main/plugins').default;

const settingsValues = app.kap.settings.getAll();

// Observers that should be disposed when the window unloads
const observersToDispose = [];

document.addEventListener('DOMContentLoaded', async () => {
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

  const audioDevices = await aperture.audioDevices();
  const [defaultAudioDevice] = audioDevices;

  if (defaultAudioDevice) {
    const defaultAudioDeviceName = shortenString(defaultAudioDevice.name, 15);
    audioInputDeviceSelector.querySelector('[value="default"]').text = `Default (${defaultAudioDeviceName})`;
  }

  for (const device of audioDevices) {
    const option = document.createElement('option');
    option.value = device.id;
    option.text = device.name;
    audioInputDeviceSelector.add(option);
  }
  audioInputDeviceSelector.value = settingsValues.audioInputDeviceId;

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
  function loadInstalledPlugins(installedPlugins) {
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
      plugins: installedPlugins
    });

    $j('#plugins-installed').html(html);
  }

  function loadAvailablePlugins(availablePlugins) {
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
      plugins: availablePlugins
    });

    $j('#plugins-available').html(html);
  }

  $j('#plugins-installed').on('click', '.uninstall', function () {
    $j(this).prop('disabled', true).text('Uninstalling…');
    const name = $j(this).data('name');
    ipcRenderer.send('uninstall-plugin', name);
  });

  $j('#plugins-available').on('click', '.install', function () {
    $j(this).prop('disabled', true).text('Installing…');
    const name = $j(this).data('name');
    ipcRenderer.send('install-plugin', name);
    $j(this).parents('li').remove(); // We don't want to wait on `loadAvailablePlugins`
  });

  ipcRenderer.on('load-plugins', (event, {available, installed}) => {
    loadAvailablePlugins(available);
    loadInstalledPlugins(installed);
  });

  // Open plugin homepage
  $j('.plugins-prefs').on('click', '.preference__url', function (event) {
    event.preventDefault();
    const url = $j(this).data('url');
    shell.openExternal(url);
  });

  loadInstalledPlugins(plugins.all());
  loadAvailablePlugins(await plugins.getFromNpm());

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
      app.kap.settings.set('highlightClicks', highlightClicksCheckbox.checked);
    }
  };

  highlightClicksCheckbox.onchange = function () {
    app.kap.settings.set('highlightClicks', this.checked);
  };

  fpsSlider.oninput = function () {
    fpsLabel.innerText = `${this.value} FPS`;
  };

  fpsSlider.onchange = function () {
    app.kap.settings.set('fps', Number(this.value));
  };

  audioInputDeviceSelector.onchange = function () {
    app.kap.settings.set('audioInputDeviceId', this.value);
  };

  // The `showCursor` setting can be changed via the
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
