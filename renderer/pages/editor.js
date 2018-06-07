import React from 'react';
import Head from 'next/head';
import {Provider} from 'unstated';

import Editor from '../components/editor';
import Options from '../components/editor/options';
import {EditorContainer, VideoContainer} from '../containers';

const editorContainer = new EditorContainer();
const videoContainer = new VideoContainer();

videoContainer.setEditorContainer(editorContainer);
editorContainer.setVideoContainer(videoContainer);

export default class EditorPage extends React.Component {
  componentDidMount() {
    const ipc = require('electron-better-ipc');

    ipc.answerMain('filePath', async filePath => {
      await new Promise((resolve, reject) => {
        editorContainer.mount(filePath, resolve, reject);
      });
      return true;
    });

    ipc.callMain('export-options').then(options => {
      editorContainer.setOptions(options);
    });
  }

  render() {
    return (
      <div className="root">
        <Head>
          <meta httpEquiv="Content-Security-Policy" content="media-src file:;"/>
        </Head>
        <div className="cover-window">
          <Provider inject={[editorContainer, videoContainer]}>
            <div className="video-container">
              <Editor/>
            </div>
            <div className="controls-container">
              <Options/>
            </div>
          </Provider>
        </div>
        <style jsx global>{`
          body,
          .cover-window {
            margin: 0;
            width: 100vw;
            height: 100vh;
            -webkit-app-region: drag;
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
            user-select: none;
            cursor: default;
            -webkit-font-smoothing: antialiased;
            letter-spacing: -.01rem;
            text-shadow: 0 1px 2px rgba(0,0,0,.1);
          }

          .cover-window {
            display: flex;
            flex-direction: column;
          }

          .video-container {
            flex: 1;
            display: flex;
            background: #000;
          }

          .controls-container {
            height: 48px;
            z-index: 10;
            display: flex;
            background: rgba(32,33,37,0.98);
          }

          * { box-sizing: border-box; }
        `}</style>
      </div>
    );
  }
}
