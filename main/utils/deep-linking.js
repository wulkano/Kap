'use strict';

const pluginPromises = new Map();

const handlePluginsDeepLink = path => {
  const [plugin, ...rest] = path.split('/');

  if (pluginPromises.has(plugin)) {
    pluginPromises.get(plugin)(rest.join('/'));
    pluginPromises.delete(plugin);
    return;
  }

  console.error(`Received link for plugin ${plugin} but there was no registered listener.`);
};

const addPluginPromise = (plugin, resolveFunction) => {
  pluginPromises.set(plugin, resolveFunc);
};

const routes = new Map([
  ['plugins', handlePluginsDeepLink]
]);

const handleDeepLink = url => {
  const {host, pathname} = new URL(url);

  if (routes.has(host)) {
    return routes.get(host)(pathname.slice(1));
  }

  console.log(`Route not recognized: ${host} (${url}).`);
};

module.exports = {
  handleDeepLink,
  addPluginPromise
};
