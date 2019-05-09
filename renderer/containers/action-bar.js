import electron from 'electron';
import {Container} from 'unstated';

const barWidth = 464;
const barHeight = 64;

export default class ActionBarContainer extends Container {
  remote = electron.remote || false

  constructor() {
    super();

    if (!this.remote) {
      this.state = {};
      return;
    }

    this.settings = this.remote.require('./common/settings');
    this.state = {
      cropperWidth: '',
      cropperHeight: ''
    };
  }

  setInputValues = ({width, height}) => {
    this.setState({
      cropperWidth: width ? width.toString() : '',
      cropperHeight: height ? height.toString() : ''
    });
  }

  setWidth = cropperWidth => this.setState({cropperWidth})

  setHeight = cropperHeight => this.setState({cropperHeight})

  setDisplay = display => {
    const {width, height, cropper} = display;
    const {x, y, ratioLocked} = cropper ? this.settings.get('actionBar') : {};

    this.setState({
      screenWidth: width,
      screenHeight: height,
      x: x ? x : (width - barWidth) / 2,
      y: y ? y : Math.ceil(height * 0.8),
      width: barWidth,
      height: barHeight,
      ratioLocked
    });
  }

  resetPosition = () => {
    const {screenWidth, screenHeight} = this.state;

    this.setState({
      x: (screenWidth - barWidth) / 2,
      y: Math.ceil(screenHeight * 0.8),
      width: barWidth,
      height: barHeight
    });
  }

  bindCursor = cursorContainer => {
    this.cursorContainer = cursorContainer;
  }

  bindCropper = cropperContainer => {
    this.cropperContainer = cropperContainer;
  }

  updateSettings = updates => {
    const {x, y, ratioLocked} = this.state;

    this.settings.set('actionBar', {
      x,
      y,
      ratioLocked,
      ...updates
    });
    this.setState(updates);
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
    if (!this.cropperContainer.state.isFullscreen) {
      const {advanced, screenWidth, screenHeight} = this.state;
      this.updateSettings({advanced: !advanced});
      if (!advanced) {
        this.cropperContainer.setSize({
          width: screenWidth * 0.2,
          height: screenHeight * 0.2
        });
      }
    }
  }

  startMoving = ({pageX, pageY}) => {
    this.setState({isMoving: true, offsetX: pageX, offsetY: pageY});
    this.cursorContainer.addCursorObserver(this.move);
  }

  stopMoving = () => {
    const {x, y} = this.state;
    this.updateSettings({x, y});
    this.setState({isMoving: false});
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

    this.setState(updates);
  }
}
