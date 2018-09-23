import React from 'react';
import {Provider} from 'unstated';
import classNames from 'classnames';

import PreferencesNavigation from '../components/preferences/navigation';
import WindowHeader from '../components/window-header';
import Categories from '../components/preferences/categories';
import {track} from '../utils/analytics';

import PreferencesContainer from '../containers/preferences';

const preferencesContainer = new PreferencesContainer();

export default class PreferencesPage extends React.Component {
  state = {overlay: false}

  componentDidMount() {
    preferencesContainer.mount(this.setOverlay);
    const ipc = require('electron-better-ipc');
    ipc.answerMain('open-plugin-config', preferencesContainer.openPluginsConfig);
  }

  setOverlay = overlay => {
    this.setState({overlay});
    track(`preferences/overlay/${overlay ? 'active' : 'inactive'}`);
  }

  render() {
    const {overlay} = this.state;
    const className = classNames('overlay', {active: overlay});

    return (
      <div className="cover-window">
        <div className={className}/>
        <Provider inject={[preferencesContainer]}>
          <WindowHeader title="Preferences">
            <PreferencesNavigation/>
          </WindowHeader>
          <Categories/>
        </Provider>
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

            .overlay {
              position: fixed;
              z-index: 12;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              transition: background-color .3s ease-in-out;
              pointer-events: none;
            }

            .overlay.active {
              background-color: rgba(0,0,0,0.5);
            }
        `}</style>
      </div>
    );
  }
}
