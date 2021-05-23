import {RemoteState, getChannelNames} from './utils';
import {ipcMain} from 'electron-better-ipc';
import {BrowserWindow} from 'electron';

// eslint-disable-next-line @typescript-eslint/ban-types
const setupRemoteState = async <State, Actions extends Record<string, Function>>(name: string, callback: RemoteState<State, Actions>) => {
  const channelNames = getChannelNames(name);

  const renderersMap = new Map<string, Set<BrowserWindow>>();

  const sendUpdate = async (state?: State, id?: string) => {
    if (id) {
      const renderers = renderersMap.get(id) ?? new Set();

      for (const renderer of renderers) {
        ipcMain.callRenderer(renderer, channelNames.stateUpdated, {state, id});
      }

      return;
    }

    for (const [windowId, renderers] of renderersMap.entries()) {
      for (const renderer of renderers) {
        if (renderer && !renderer.isDestroyed()) {
          ipcMain.callRenderer(renderer, channelNames.stateUpdated, {state: state ?? (await getState?.(windowId))});
        } else {
          renderers.delete(renderer);
        }
      }
    }
  };

  const {getState, actions = {}, subscribe} = await callback(sendUpdate);

  ipcMain.answerRenderer(channelNames.subscribe, (customId: string, window: BrowserWindow) => {
    const id = customId ?? window.id.toString();

    if (!renderersMap.has(id)) {
      renderersMap.set(id, new Set());
    }

    renderersMap.get(id)?.add(window);
    const unsubscribe = subscribe?.(id);

    window.on('close', () => {
      renderersMap.get(id)?.delete(window);
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
    return (actions as any)[key]?.(id, ...data);
  });
};

export default setupRemoteState;
