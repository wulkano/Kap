'use strict';
const getChannelName = (name, action) => `kap-remote-state-${name}-${action}`;

const getChannelNames = name => ({
  subscribe: getChannelName(name, 'subscribe'),
  getState: getChannelName(name, 'get-state'),
  callAction: getChannelName(name, 'call-action'),
  stateUpdated: getChannelName(name, 'state-updated')
});

const useRemoteState = (name, initialState) => {
  const {useState, useEffect, useRef} = require('react');
  const {ipcRenderer} = require('electron-better-ipc');

  const channelNames = getChannelNames(name);

  return id => {
    const [state, setState] = useState(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const actionsRef = useRef({});

    useEffect(() => {
      const cleanup = ipcRenderer.answerMain(channelNames.stateUpdated, setState);

      (async () => {
        const actionKeys = await ipcRenderer.callMain(channelNames.subscribe, id);
        console.log(actionKeys);
        const actions = actionKeys.reduce((acc, key) => ({
          ...acc,
          [key]: data => ipcRenderer.callMain(channelNames.callAction, {key, data, id})
        }), {});

        console.log(actions);

        const getState = async () => {
          const newState = await ipcRenderer.callMain(channelNames.getState, id);
          setState(newState);
        }

        actionsRef.current = {
          ...actions,
          refreshState: getState
        };

        await getState();
        setIsLoading(false);
      })();

      return cleanup;
    }, []);

    console.log(actionsRef.current);

    return {
      ...actionsRef.current,
      isLoading,
      state
    };
  };
}

const setupRemoteState = (name, callback) => {
  const channelNames = getChannelNames(name);

  return async () => {
    const {ipcMain} = require('electron-better-ipc');

    const renderers = new Map();

    const sendUpdate = (state, id) => {
      if (id) {
        return ipcMain.callRenderer(renderers.get(id), channelNames.stateUpdated, state);
      }

      for (const [windowId, renderer] of renderers.entries()) {
        ipcMain.callRenderer(renderer, channelNames.stateUpdated, state || (getState && getState(windowId)));
      }
    };

    const {getState, actions = {}} = await callback(sendUpdate);

    ipcMain.answerRenderer(channelNames.subscribe, async (customId, window) => {
      const id = customId || window.id;
      renderers.set(id, window);

      window.on('closed', () => {
        renderers.delete(id);
      });

      return Object.keys(actions);
    });

    ipcMain.answerRenderer(channelNames.getState, async (customId, window) => {
      const id = customId || window.id;
      return getState(id);
    });

    ipcMain.answerRenderer(channelNames.callAction, async ({key, data, id: customId}, window) => {
      const id = customId || window.id;
      return actions[key](data, id);
    });
  }
}

module.exports = {
  useRemoteState,
  setupRemoteState
};
