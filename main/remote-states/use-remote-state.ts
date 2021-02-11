import {RemoteState, getChannelNames} from './utils';
import {useState, useEffect, useRef} from 'react';
import {ipcRenderer} from 'electron-better-ipc';

const useRemoteState = <Callback extends RemoteState<any, any>>(
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
        const actionKeys = (await ipcRenderer.callMain(channelNames.subscribe, id)) as string[];

        const actions = actionKeys.reduce((acc, key) => ({
          ...acc,
          [key]: (data: any) => {
            console.log('Action', key, 'called with', data);
            return ipcRenderer.callMain(channelNames.callAction, {key, data, id})
          }
        }), {});

        const getState = async () => {
          const newState = (await ipcRenderer.callMain(channelNames.getState, id)) as typeof state;
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

    return {
      ...actionsRef.current,
      isLoading,
      state
    };
  }
}

export default useRemoteState;
