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
  wasPaused = false;

  componentDidMount() {
    const {ipcRenderer: ipc} = require('electron-better-ipc');

    ipc.answerMain('file', async ({filePath, fps, originalFilePath}) => {
      await new Promise((resolve, reject) => {
        editorContainer.mount(filePath, parseInt(fps, 10), originalFilePath, resolve, reject);
      });
      return true;
    });

    ipc.answerMain('export-options', editorContainer.setOptions);
    ipc.answerMain('save-original', editorContainer.saveOriginal);

    ipc.answerMain('blur', () => {
      this.wasPaused = videoContainer.state.isPaused;
      videoContainer.pause();
    });
    ipc.answerMain('focus', () => {
      if (!this.wasPaused) {
        videoContainer.play();
      }
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
          html {
            font-size: 62.5%;
          }

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
            z-index: 50;
            display: flex;
            background: rgba(32,33,37,0.98);
          }

          @keyframes shake-left {
            10%,
            90% {
              transform: translate3d(-1px, 0, 0);
            }

            20%,
            80% {
              transform: translate3d(0, 0, 0);
            }

            30%,
            50%,
            70% {
              transform: translate3d(-4px, 0, 0);
            }

            40%,
            60% {
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes shake-right {
            10%,
            90% {
              transform: translate3d(1px, 0, 0);
            }

            20%,
            80% {
              transform: translate3d(0, 0, 0);
            }

            30%,
            50%,
            70% {
              transform: translate3d(4px, 0, 0);
            }

            40%,
            60% {
              transform: translate3d(0, 0, 0);
            }
          }

          .shake-left {
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            perspective: 1000px;
            animation: shake-left 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }

          .shake-right {
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            perspective: 1000px;
            animation: shake-right 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
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

          * { box-sizing: border-box; }
        `}</style>
      </div>
    );
  }
}
