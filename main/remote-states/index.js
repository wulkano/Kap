'use strict';

const {setupRemoteState} = require('../common/remote-state');

const remoteStateNames = ['editor-options'];

for(const name of remoteStateNames) {
  setupRemoteState(name, require(`./${name}`))();
}
