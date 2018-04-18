// Packages
import React from 'react'
import electron from 'electron';
import {Provider} from 'unstated';

// Components
import Overlay from '../components/cropper/overlay';
import Cropper from '../components/cropper';

// Containers
import CursorContainer from '../containers/cursor';
import CropperContainer from '../containers/cropper';
import ActionBarContainer from '../containers/action-bar';

const cursorContainer = new CursorContainer();
const cropperContainer = new CropperContainer();
const actionBarContainer = new ActionBarContainer();

cropperContainer.bindCursor(cursorContainer);
cropperContainer.bindActionBar(actionBarContainer);
actionBarContainer.bindCursor(cursorContainer);
actionBarContainer.bindCropper(cropperContainer);

export default class extends React.Component {
  remote = electron.remote || false

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyEvent);
    document.addEventListener('keyup', this.handleKeyEvent);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyEvent);
    document.removeEventListener('keyup', this.handleKeyEvent);
  }

  handleKeyEvent = (event) => {
    switch (event.keyCode) {
      case 27:
        this.remote.getCurrentWindow().close();
        break;
      case 16:
        actionBarContainer.toggleRatioLock(event.type === 'keydown');
        break;
      default:
        break;
    }
  }

  render() {
    return (
      <div className='cover-screen'>
        <Provider inject={[cursorContainer, cropperContainer, actionBarContainer]}>
          <Overlay>
            <Cropper />
          </Overlay>
        </Provider>
        <style jsx global>{`
          html,
          body,
          .cover-screen {
            margin: 0;
            width: 100vw;
            height: 100vh;
            -webkit-user-select: none;
            display: flex;
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
          }

          .content {
            flex: 1;
            display: flex;
          }
        `}</style>
      </div>
    )
  }
}
