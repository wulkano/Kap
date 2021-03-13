import {windowManager} from '../windows/manager';

const pluginPromises = new Map<string, (path: string) => void>();

const handlePluginsDeepLink = (path: string) => {
  const [plugin, ...rest] = path.split('/');

  if (pluginPromises.has(plugin)) {
    pluginPromises.get(plugin)?.(rest.join('/'));
    pluginPromises.delete(plugin);
    return;
  }

  console.error(`Received link for plugin “${plugin}” but there was no registered listener.`);
};

export const addPluginPromise = (plugin: string, resolveFunction: (path: string) => void) => {
  pluginPromises.set(plugin, resolveFunction);
};

const triggerPluginAction = (action: string) => (name: string) => windowManager.preferences?.open({target: {name, action}});

const routes = new Map([
  ['plugins', handlePluginsDeepLink],
  ['install-plugin', triggerPluginAction('install')],
  ['configure-plugin', triggerPluginAction('configure')]
]);

export const handleDeepLink = (url: string) => {
  const {host, pathname} = new URL(url);

  if (routes.has(host)) {
    return routes.get(host)?.(pathname.slice(1));
  }

  console.error(`Route not recognized: ${host} (${url}).`);
};
