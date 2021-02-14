import {RemoteState, getChannelNames} from './utils';
import {ipcMain} from 'electron-better-ipc';
import {BrowserWindow} from 'electron';

// eslint-disable-next-line @typescript-eslint/ban-types
const setupRemoteState = async <State, Actions extends Record<string, Function>>(name: string, callback: RemoteState<State, Actions>) => {
  const channelNames = getChannelNames(name);

  const renderers = new Map<string, BrowserWindow>();

  const sendUpdate = async (state?: State, id?: string) => {
    if (id) {
      const renderer = renderers.get(id);

      if (renderer) {
        ipcMain.callRenderer(renderer, channelNames.stateUpdated, state);
      }

      return;
    }

    for (const [windowId, renderer] of renderers.entries()) {
      if (renderer && !renderer.isDestroyed()) {
        ipcMain.callRenderer(renderer, channelNames.stateUpdated, state ?? (await getState?.(windowId)));
      }
    }
  };

  const {getState, actions = {}, subscribe} = await callback(sendUpdate);

  ipcMain.answerRenderer(channelNames.subscribe, (customId: string, window: BrowserWindow) => {
    const id = customId ?? window.id.toString();
    renderers.set(id, window);
    const unsubscribe = subscribe?.(id);

    window.on('close', () => {
      renderers.delete(id);
      unsubscribe?.();
    });

    return Object.keys(actions);
  });

  ipcMain.answerRenderer(channelNames.getState, async (customId: string, window: BrowserWindow) => {
    const id = customId ?? window.id.toString();
    return getState(id);
  });

  ipcMain.answerRenderer(channelNames.callAction, ({key, data, id: customId}: any, window: BrowserWindow) => {
    const id = customId || window.id.toString();
    return (actions as any)[key]?.(data, id);
  });
};

export default setupRemoteState;
