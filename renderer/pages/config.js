import React from 'react';
import {Provider} from 'unstated';
import {ipcRenderer as ipc} from 'electron-better-ipc';

import {ConfigContainer} from '../containers';
import Config from '../components/config';
import WindowHeader from '../components/window-header';

const configContainer = new ConfigContainer();

export default class ConfigPage extends React.Component {
  state = {pluginName: ''}

  componentDidMount() {
    ipc.answerMain('plugin', pluginName => {
      configContainer.setPlugin(pluginName);
      this.setState({pluginName: pluginName.replace(/^kap-/, '')});
    });
  }

  render() {
    const {pluginName} = this.state;

    return (
      <div className="root">
        <div className="cover-window">
          <Provider inject={[configContainer]}>
            <WindowHeader title={pluginName}/>
            <Config/>
          </Provider>
        </div>
        <style jsx global>{`
          html {
            font-size: 62.5%;
          }

          html,
          body,
          .cover-window {
            margin: 0;
            width: 100vw;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
          }

          :root {
            --background-color: #ffffff;
            --button-color: var(--kap);
          }

          .dark .cover-window {
            --background-color: #313234;
            --button-color: #2182f0;
          }

          .cover-window {
            background-color: var(--background-color);
            z-index: -2;
            display: flex;
            flex-direction: column;
            font-size: 1.4rem;
            line-height: 1.5em;
            -webkit-font-smoothing: antialiased;
            letter-spacing: -.01rem;
            cursor: default;
          }
        `}</style>
      </div>
    );
  }
}
