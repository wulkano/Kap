import {Promisable} from 'type-fest';
import {useState, useEffect, useRef} from 'react';
import {ipcRenderer} from 'electron-better-ipc';

// TODO: Import these util exports from the `main/remote-states/utils` file once we figure out the correct TS configuration
export const getChannelName = (name: string, action: string) => `kap-remote-state-${name}-${action}`;

export const getChannelNames = (name: string) => ({
  subscribe: getChannelName(name, 'subscribe'),
  getState: getChannelName(name, 'get-state'),
  callAction: getChannelName(name, 'call-action'),
  stateUpdated: getChannelName(name, 'state-updated')
});

// eslint-disable-next-line @typescript-eslint/ban-types
export type RemoteState<State, Actions extends Record<string, Function>> = (sendUpdate: (state?: State, id?: string) => void) => Promisable<{
  getState: (id?: string) => Promisable<State>;
  actions: Actions;
  subscribe?: (id?: string) => undefined | (() => void);
}>;

const createRemoteStateHook = <Callback extends RemoteState<any, any>>(
  name: string,
  initialState?: Callback extends RemoteState<infer State, any> ? State : never
): (id?: string) => (
  Callback extends RemoteState<infer State, infer Actions> ? (
    Actions & {
      state: State;
      isLoading: false;
      refreshState: () => void;
    }
  ) : never
) => {
  const channelNames = getChannelNames(name);

  return (id?: string) => {
    const [state, setState] = useState(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const actionsRef = useRef<any>({});

    useEffect(() => {
      const cleanup = ipcRenderer.answerMain(channelNames.stateUpdated, setState);

      (async () => {
        const actionKeys = (await ipcRenderer.callMain<string, string[]>(channelNames.subscribe, id));

        // eslint-disable-next-line unicorn/no-array-reduce
        const actions = actionKeys.reduce((acc, key) => ({
          ...acc,
          [key]: async (data: any) => ipcRenderer.callMain(channelNames.callAction, {key, data, id})
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
