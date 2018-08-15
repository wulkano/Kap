import React from 'react';
import {Provider} from 'unstated';

import WindowHeader from '../components/window-header';
import Exports from '../components/exports';

import ExportsContainer from '../containers/exports';

const exportsContainer = new ExportsContainer();

export default class ExportsPage extends React.Component {
  componentDidMount() {
    exportsContainer.mount();
  }

  render() {
    return (
      <div className="cover-window">
        <Provider inject={[exportsContainer]}>
          <WindowHeader title="Exports"/>
          <Exports/>
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
