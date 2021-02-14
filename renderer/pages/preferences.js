import React from 'react';
import {Provider} from 'unstated';
import classNames from 'classnames';
import {ipcRenderer as ipc} from 'electron-better-ipc';

import PreferencesNavigation from '../components/preferences/navigation';
import WindowHeader from '../components/window-header';
import Categories from '../components/preferences/categories';

import PreferencesContainer from '../containers/preferences';

const preferencesContainer = new PreferencesContainer();

export default class PreferencesPage extends React.Component {
  state = {overlay: false};

  componentDidMount() {
    ipc.answerMain('open-plugin-config', preferencesContainer.openPluginsConfig);
    ipc.answerMain('options', preferencesContainer.setNavigation);
    ipc.answerMain('mount', async () => preferencesContainer.mount(this.setOverlay));
  }

  setOverlay = overlay => {
    this.setState({overlay});
  };

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
              background-color: var(--window-background-color);
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
              background-color: rgba(0,0,0,0.2);
            }


            @keyframes shake {
              10%,
              90% {
                transform: translate3d(-1px, 0, 0);
              }

              20%,
              80% {
                transform: translate3d(2px, 0, 0);
              }

              30%,
              50%,
              70% {
                transform: translate3d(-4px, 0, 0);
              }

              40%,
              60% {
                transform: translate3d(4px, 0, 0);
              }
            }

            .shake {
              transform: translate3d(0, 0, 0);
              backface-visibility: hidden;
              perspective: 1000px;
              animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            }

            :root {
              --navigation-item-border-color: rgba(0, 0, 0, 0.1);
              --navigation-item-box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
              --navigation-item-box-shadow-active: var(--navigation-item-box-shadow);
              --navigation-item-background: transparent;
              --navigation-item-outline-active: none;
              --navigation-item-active-border-color: rgba(0, 0, 0, 0.2);
              --navigation-item-hover-color: rgba(0, 0, 0, 0.8);
              --background-color: #fff;
            }

            .dark {
              --navigation-item-border-color: transparent;
              --navigation-item-background: var(--input-background-color);
              --navigation-item-box-shoadow-active: 0px 1px 2px 0px rgba(0, 0, 0, 0.03);
              --navigation-item-outline-active: 1px solid rgba(0, 0, 0, 0.1);
              --navigation-item-active-border-color: transparent;
              --navigation-item-hover-color: rgba(255, 255, 255, .8);
              --background-color: #222222;
            }

        `}</style>
      </div>
    );
  }
}
