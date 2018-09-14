import React from 'react';
import {Provider} from 'unstated';

import {ConfigContainer} from '../containers';
import WindowHeader from '../components/window-header';

const configContainer = new ConfigContainer();

export default class ConfigPage extends React.Component {
  state = {}

  componentDidMount() {
    const ipc = require('electron-better-ipc');

    ipc.answerMain('plugin', ({pluginName, services}) => {
      configContainer.setPlugin(pluginName, services);
      this.setState({pluginName});
    });
  }

  render() {
    const {pluginName = ''} = this.state;

    return (
      <div className="root">
        <div className="cover-window">
          <Provider inject={[configContainer]}>
            <WindowHeader title={pluginName.replace(/^kap-/, '')}/>
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

          .cover-window {
            background-color: white;
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
