import {useState, useEffect, useRef} from 'react';
import {ipcRenderer} from 'electron-better-ipc';
import {RemoteState, RemoteStateHook} from '../common/types';

// TODO: Import these util exports from the `main/remote-states/utils` file once we figure out the correct TS configuration
export const getChannelName = (name: string, action: string) => `kap-remote-state-${name}-${action}`;

export const getChannelNames = (name: string) => ({
  subscribe: getChannelName(name, 'subscribe'),
  getState: getChannelName(name, 'get-state'),
  callAction: getChannelName(name, 'call-action'),
  stateUpdated: getChannelName(name, 'state-updated')
});

const createRemoteStateHook = <Callback extends RemoteState>(
  name: string,
  initialState?: Callback extends RemoteState<infer State> ? State : never
): (id?: string) => RemoteStateHook<Callback> => {
  const channelNames = getChannelNames(name);

  return (id?: string) => {
    const [state, setState] = useState(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const actionsRef = useRef<any>({});

    useEffect(() => {
      const cleanup = ipcRenderer.answerMain(channelNames.stateUpdated, (data: {id?: string; state: any}) => {
        if (data.id === id) {
          setState(data.state);
        }
      });

      (async () => {
        const actionKeys = (await ipcRenderer.callMain<string, string[]>(channelNames.subscribe, id));

        // eslint-disable-next-line unicorn/no-array-reduce
        const actions = actionKeys.reduce((acc, key) => ({
          ...acc,
          [key]: async (...data: any) => ipcRenderer.callMain(channelNames.callAction, {key, data, id})
        }), {});

        const getState = async () => {
          const newState = (await ipcRenderer.callMain<string, any>(channelNames.getState, id));
          setState(newState);
        };

        actionsRef.current = {
          ...actions,
          refreshState: getState
        };

        await getState();
        setIsLoading(false);
      })();

      return cleanup;
    }, []);

    return {
      ...actionsRef.current,
      isLoading,
      state
    };
  };
};

export default createRemoteStateHook;
