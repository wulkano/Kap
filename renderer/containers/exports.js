import {Container} from 'unstated';
import {ipcRenderer as ipc} from 'electron-better-ipc';

export default class ExportsContainer extends Container {
  state = {
    exports: []
  }

  mount = async () => {
    const exports = await ipc.callMain('get-exports');

    this.setState({
      exports: exports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      isMounted: true
    });

    const {ipcRenderer} = require('electron');
    ipcRenderer.on('update-export', (_, updates) => this.update(updates));
  }

  update = updates => {
    const {createdAt} = updates;
    const {exports} = this.state;

    const index = exports.findIndex(exp => exp.createdAt === createdAt);
    if (index === -1) {
      exports.unshift(updates);
    } else {
      if (!exports[index].error && updates.error) {
        console.error(updates.error);
      }

      exports[index] = updates;
    }

    this.setState({exports});
  }

  cancel = createdAt => {
    ipc.callMain('cancel-export', createdAt);
  }

  openInEditor = createdAt => {
    ipc.callMain('open-export', createdAt);
  }
}
