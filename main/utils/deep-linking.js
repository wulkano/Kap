'use strict';

const {openPrefsWindow} = require('../preferences');
const pluginPromises = new Map();

const handlePluginsDeepLink = path => {
  const [plugin, ...rest] = path.split('/');

  if (pluginPromises.has(plugin)) {
    pluginPromises.get(plugin)(rest.join('/'));
    pluginPromises.delete(plugin);
    return;
  }

  console.error(`Received link for plugin “${plugin}” but there was no registered listener.`);
};

const addPluginPromise = (plugin, resolveFunction) => {
  pluginPromises.set(plugin, resolveFunction);
};

const triggerPluginAction = action => name => openPrefsWindow({target: {name, action}});

const routes = new Map([
  ['plugins', handlePluginsDeepLink],
  ['install-plugin', triggerPluginAction('install')],
  ['configure-plugin', triggerPluginAction('configure')]
]);

const handleDeepLink = url => {
  const {host, pathname} = new URL(url);

  if (routes.has(host)) {
    return routes.get(host)(pathname.slice(1));
  }

  console.error(`Route not recognized: ${host} (${url}).`);
};

module.exports = {
  handleDeepLink,
  addPluginPromise
};
