import {Promisable} from 'type-fest';

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
