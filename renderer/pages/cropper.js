import electron from 'electron';
import React from 'react';
import {Provider} from 'unstated';

import Overlay from '../components/cropper/overlay';
import Cropper from '../components/cropper';
import ActionBar from '../components/action-bar';

import CursorContainer from '../containers/cursor';
import CropperContainer from '../containers/cropper';
import ActionBarContainer from '../containers/action-bar';

import '../utils/sentry';

const cursorContainer = new CursorContainer();
const cropperContainer = new CropperContainer();
const actionBarContainer = new ActionBarContainer();

cropperContainer.bindCursor(cursorContainer);
cropperContainer.bindActionBar(actionBarContainer);
actionBarContainer.bindCursor(cursorContainer);
actionBarContainer.bindCropper(cropperContainer);

let lastRatioLockState = null;

export default class CropperPage extends React.Component {
  remote = electron.remote || false

  dev = false;

  constructor(props) {
    super(props);

    if (!electron.ipcRenderer) {
      return;
    }

    const {ipcRenderer, remote} = electron;

    ipcRenderer.on('display', (_, display) => {
      cropperContainer.setDisplay(display);
      actionBarContainer.setDisplay(display);
    });

    ipcRenderer.on('select-app', (_, app) => {
      cropperContainer.selectApp(app);
    });

    ipcRenderer.on('blur', () => {
      cropperContainer.setActive(false);
    });

    ipcRenderer.on('start-recording', () => {
      cropperContainer.setRecording();
    });

    const window = remote.getCurrentWindow();
    window.on('focus', () => {
      cropperContainer.setActive(true);
    });

    window.on('blur', event => {
      if (!event.defaultPrevented) {
        cropperContainer.setActive(false);
      }
    });
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyEvent);
    document.addEventListener('keyup', this.handleKeyEvent);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyEvent);
    document.removeEventListener('keyup', this.handleKeyEvent);
  }

  handleKeyEvent = event => {
    switch (event.key) {
      case 'Escape':
        this.remote.getCurrentWindow().close();
        break;
      case 'Shift':
        if (event.type === 'keydown' && !event.defaultPrevented) {
          lastRatioLockState = actionBarContainer.state.ratioLocked;
          actionBarContainer.toggleRatioLock(true);
        } else if (event.type === 'keyup' && lastRatioLockState !== null) {
          actionBarContainer.toggleRatioLock(lastRatioLockState);
          lastRatioLockState = null;
        }
        break;
      case 'i':
        this.remote.getCurrentWindow().setIgnoreMouseEvents(true);
        this.dev = !this.dev;
        break;
      default:
        break;
    }
  }

  render() {
    return (
      <div className="cover-screen">
        <Provider inject={[cursorContainer, cropperContainer, actionBarContainer]}>
          <Overlay>
            <Cropper/>
            <ActionBar/>
          </Overlay>
        </Provider>
        <style jsx global>{`
          html,
          body,
          .cover-screen {
            margin: 0;
            width: 100vw;
            height: 100vh;
            user-select: none;
            display: flex;
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
          }

          .content {
            flex: 1;
            display: flex;
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
        `}</style>
      </div>
    );
  }
}
