// Packages
import {Container} from 'unstated';
import electron from 'electron';

const {width: screenWidth, height: screenHeight} = electron.screen && electron.screen.getPrimaryDisplay().bounds || {};

class ActionBarContainer extends Container {
  state = {
    width: 300,
    height: 50,
    x: (screenWidth - 300)/2,
    y: screenHeight - 50 - 10,
    advanced: false,
    ratioLocked: false,
    screenWidth,
    screenHeight
  }

  bindCursor = cursorContainer => {
    this.cursorContainer = cursorContainer;
  }

  bindCropper = cropperContainer => {
    this.cropperContainer = cropperContainer
  }

  startRecording = event => {
    event.stopPropagation();

    const tray = electron.remote && electron.remote.getGlobal('tray');
    const {x, y, width, height} = tray.getBounds();

    const actionBar = document.getElementsByClassName('action-bar')[0];
    actionBar.addEventListener('transitionend', () => actionBar.style.display = 'none');

    this.setState({recording: true, x, y: 0, width, height});
  }

  toggleRatioLock = ratioLocked => {
    if (!ratioLocked) {
      this.setState({ratioLocked: !this.state.ratioLocked});
    } else {
      this.setState({ratioLocked});
    }
    this.cropperContainer.setOriginal();
  }

  toggleAdvanced = () => this.setState({advanced: !this.state.advanced});

  startMoving = ({pageX, pageY}) => {
    this.setState({moving: true, offsetX: pageX, offsetY: pageY, moved: true});
    this.cursorContainer.addCursorObserver(this.move);
  }

  stopMoving = () => {
    this.setState({moving: false});
    this.cursorContainer.removeCursorObserver(this.move);
  }

  move = ({pageX, pageY}) => {
    const {x, y, offsetX, offsetY, height, width, screenWidth, screenHeight} = this.state;

    const updates = {
      offsetX: pageX,
      offsetY: pageY
    };

    if(y + pageY - offsetY + height <= screenHeight && y + pageY - offsetY >= 0) {
      updates.y = y + pageY - offsetY;
    }

    if(x + pageX - offsetX + width <= screenWidth  && x + pageX - offsetX >= 0) {
      updates.x = x + pageX - offsetX;
    }

    this.setState(updates);
  }

}

export default ActionBarContainer;
