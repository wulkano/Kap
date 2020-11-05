import {RemoteState, getChannelNames} from './utils';
import {ipcMain} from 'electron-better-ipc';
import {BrowserWindow} from 'electron';

const setupRemoteState = async <State, Actions extends {[key: string]: Function}>(name: string, callback: RemoteState<State, Actions>) => {
  const channelNames = getChannelNames(name);

  const renderers = new Map();

  const sendUpdate = async (state?: State, id?: string) => {
    if (id) {
      return ipcMain.callRenderer(renderers.get(id), channelNames.stateUpdated, state);
    }

    for (const [windowId, renderer] of renderers.entries()) {
      ipcMain.callRenderer(renderer, channelNames.stateUpdated, state ?? (await getState?.(windowId)));
    }
  }

  const {getState, actions = {}} = await callback(sendUpdate);

  ipcMain.answerRenderer(channelNames.subscribe, (customId: string, window: BrowserWindow) => {
    const id = customId ?? window.id.toString();
    renderers.set(id, window);

    window.on('closed', () => {
      renderers.delete(id);
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
}

export default setupRemoteState;
