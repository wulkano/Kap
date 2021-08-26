import setupRemoteState from './setup-remote-state';

const remoteStateNames = ['editor-options', 'exports', 'exports-list'];

export const setupRemoteStates = async () => {
  return Promise.all(remoteStateNames.map(async fileName => {
    const state = require(`./${fileName}`);
    console.log(`Setting up remote-state: ${state.name}`);
    setupRemoteState(state.name, state.default);
  }));
};
