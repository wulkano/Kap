import electron from 'electron';
import {Container} from 'unstated';

const {width: screenWidth, height: screenHeight} = (electron.screen && electron.screen.getPrimaryDisplay().bounds) || {};

export default class ActionBarContainer extends Container {
  remote = electron.remote || false

  constructor() {
    super();

    if (!this.remote) {
      this.state = {};
      return;
    }

    this.settings = this.remote.require('./common/settings');
    this.actionBar = this.settings.get('actionBar');

    this.state = {
      x: (screenWidth - 300) / 2,
      y: Math.ceil(screenHeight * 0.8),
      ...this.actionBar,
      width: 400,
      height: 50,
      screenWidth,
      screenHeight
    };
  }

  bindCursor = cursorContainer => {
    this.cursorContainer = cursorContainer;
  }

  bindCropper = cropperContainer => {
    this.cropperContainer = cropperContainer;
  }

  updateSettings = updates => {
    this.actionBar = {...this.actionBar, ...updates};
    this.settings.set('actionBar', this.actionBar);
    this.setState(updates);
  }

  startRecording = event => {
    event.stopPropagation();

    const tray = electron.remote && electron.remote.getGlobal('tray');
    const {x, width, height} = tray.getBounds();

    const actionBar = document.querySelector('.action-bar');
    actionBar.addEventListener('transitionend', () => {
      actionBar.style.display = 'none';
    });

    this.setState({recording: true, x, y: 0, width, height});
  }

  toggleRatioLock = ratioLocked => {
    const {ratioLocked: isLocked} = this.state;
    if (ratioLocked) {
      this.updateSettings({ratioLocked});
    } else {
      this.updateSettings({ratioLocked: !isLocked});
    }
    this.cropperContainer.setOriginal();
  }

  toggleAdvanced = () => {
    const {advanced} = this.state;
    this.updateSettings({advanced: !advanced});
  }

  startMoving = ({pageX, pageY}) => {
    this.setState({moving: true, offsetX: pageX, offsetY: pageY});
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

    if (y + pageY - offsetY + height <= screenHeight && y + pageY - offsetY >= 0) {
      updates.y = y + pageY - offsetY;
    }

    if (x + pageX - offsetX + width <= screenWidth && x + pageX - offsetX >= 0) {
      updates.x = x + pageX - offsetX;
    }

    this.updateSettings(updates);
  }
}
