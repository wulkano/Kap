import setupRemoteState from './setup-remote-state';

const remoteStateNames = ['editor-options', 'conversion'];

export const setupRemoteStates = async () => {
  return Promise.all(remoteStateNames.map(async fileName => {
    const state = require(`./${fileName}`);
    setupRemoteState(state.name, state.default);
  }));
};
