import React from 'react';
import {Provider} from 'unstated';

import PreferencesNavigation from '../components/preferences/navigation';
import WindowHeader from '../components/window-header';
import Categories from '../components/preferences/categories';

import PreferencesContainer from '../containers/preferences';

const preferencesContainer = new PreferencesContainer();

export default class PreferencesPage extends React.Component {
  componentDidMount() {
    preferencesContainer.mount();
  }

  render() {
    return (
      <div className="cover-window">
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
        `}</style>
      </div>
    );
  }
}
