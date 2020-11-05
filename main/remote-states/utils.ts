
export const getChannelName = (name: string, action: string) => `kap-remote-state-${name}-${action}`;

export const getChannelNames = (name: string) => ({
  subscribe: getChannelName(name, 'subscribe'),
  getState: getChannelName(name, 'get-state'),
  callAction: getChannelName(name, 'call-action'),
  stateUpdated: getChannelName(name, 'state-updated')
});

export type RemoteState<State, Actions extends {[key: string]: Function}> = (sendUpdate: (state?: State, id?: string) => void) => {
  getState: (id?: string) => State,
  actions: Actions
}
