
const path = require('path');
const electron = require('electron');
const Store = require('electron-store');
const {ipcMain: ipc} = require('electron-better-ipc');

const {app} = electron;
const plugins = require('./common/plugins');
const {converters} = require('./convert');
const {setOptions, getEditors} = require('./editor');

const exportUsageHistory = new Store({
  name: 'export-usage-history',
  defaults: {
    apng: {lastUsed: 1, plugins: {default: 1}},
    webm: {lastUsed: 2, plugins: {default: 1}},
    mp4: {lastUsed: 3, plugins: {default: 1}},
    gif: {lastUsed: 4, plugins: {default: 1}}
  }
});

const prettifyFormat = format => {
  const formats = new Map([
    ['apng', 'APNG'],
    ['gif', 'GIF'],
    ['mp4', 'MP4'],
    ['webm', 'WebM']
  ]);

  return formats.get(format);
};

const getExportOptions = () => {
  const cwd = path.join(app.getPath('userData'), 'plugins');
  const installed = plugins.getInstalled();

  const options = [];
  for (const format of converters.keys()) {
    options.push({
      format,
      prettyFormat: prettifyFormat(format),
      plugins: [{
        title: 'Save to Disk',
        pluginName: 'default',
        isDefault: true
      }]
    });
  }

  for (const json of installed) {
    if (!json.isCompatible) {
      continue;
    }

    const plugin = require(path.join(cwd, 'node_modules', json.name));
    for (const service of plugin.shareServices) {
      for (const format of service.formats) {
        options.find(option => option.format === format).plugins.push({title: service.title, pluginName: json.name});
      }
    }
  }

  const sortFunc = (a, b) => b.lastUsed - a.lastUsed;

  for (const option of options) {
    const {lastUsed, plugins} = exportUsageHistory.get(option.format);
    option.lastUsed = lastUsed;
    option.plugins = option.plugins.map(plugin => ({...plugin, lastUsed: plugins[plugin.pluginName] || 0})).sort(sortFunc);
  }

  return options.sort(sortFunc);
};

const updateExportOptions = () => {
  const editors = getEditors();
  const exportOptions = getExportOptions();
  for (const editor of editors) {
    ipc.callRenderer(editor, 'export-options', exportOptions);
  }

  setOptions(exportOptions);
};

plugins.setUpdateExportOptions(updateExportOptions);

ipc.answerRenderer('update-usage', ({format, plugin}) => {
  const usage = exportUsageHistory.get(format);
  const now = Date.now();

  usage.plugins[plugin] = now;
  usage.lastUsed = now;
  exportUsageHistory.set(format, usage);
  updateExportOptions();
});

const initializeExportOptions = () => {
  setOptions(getExportOptions());
};

module.exports = {
  getExportOptions,
  updateExportOptions,
  initializeExportOptions
};
