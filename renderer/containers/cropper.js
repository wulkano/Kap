import electron from 'electron';
import nearestNormalAspectRatio from 'nearest-normal-aspect-ratio';
import {Container} from 'unstated';

// Helper function for retrieving the simplest ratio,
// via the largest common divisor of two numbers (thanks @doot0)
const getLargestCommonDivisor = (first, second) => {
  if (!first) {
    return 1;
  }

  if (!second) {
    return first;
  }

  return getLargestCommonDivisor(second, first % second);
};

const getSimplestRatio = (width, height) => {
  const lcd = getLargestCommonDivisor(width, height);
  const denominator = width / lcd;
  const numerator = height / lcd;

  return [denominator, numerator];
};

export const findRatioForSize = (width, height) => {
  const ratio = nearestNormalAspectRatio(width, height);

  if (ratio) {
    return ratio.split(':').map(part => parseInt(part, 10));
  }

  return getSimplestRatio(width, height);
};

export default class CropperContainer extends Container {
  remote = electron.remote || false;

  constructor() {
    super();

    if (!this.remote) {
      this.state = {};
      return;
    }

    this.settings = this.remote.require('./common/settings');

    this.state = {
      isRecording: false,
      isResizing: false,
      isMoving: false,
      isPicking: false,
      showHandles: true,
      selectedApp: '',
      screenWidth: 0,
      screenHeight: 0,
      isActive: false,
      isReady: false,
      ratio: [1, 1]
    };
  }

  setDisplay = display => {
    const {width: screenWidth, height: screenHeight, isActive, id, cropper = {}} = display;
    const {x, y, width, height, ratio} = cropper;

    this.setState({
      screenWidth,
      screenHeight,
      isActive,
      isReady: true,
      displayId: id,
      x: x || screenWidth / 2,
      y: y || screenHeight / 2,
      width,
      height,
      ratio: ratio || [1, 1]
    });
    this.actionBarContainer.setInputValues({width: width || 0, height: height || 0});
  }

  willStartRecording = () => {
    this.setState({willStartRecording: true});
  }

  setRecording = () => {
    this.setState({isRecording: true});
  }

  setActive = isActive => {
    const updates = {isActive};

    if (!isActive) {
      updates.x = 0;
      updates.y = 0;
      updates.width = 0;
      updates.height = 0;
      updates.isFullscreen = false;
      updates.showHandles = true;
      updates.selectedApp = '';
    }

    this.setState(updates);
  }

  updateSettings = updates => {
    const {x, y, width, height, ratio, displayId} = this.state;

    this.settings.set('cropper', {
      x,
      y,
      width,
      height,
      ratio,
      ...updates,
      displayId
    });
    this.setState(updates);
  }

  bindCursor = cursorContainer => {
    this.cursorContainer = cursorContainer;
  }

  bindActionBar = actionBarContainer => {
    this.actionBarContainer = actionBarContainer;
  }

  setBounds = (bounds, {save = true, ignoreRatioLocked} = {}) => {
    if (bounds) {
      const updates = bounds;

      if ((!this.actionBarContainer.state.ratioLocked || ignoreRatioLocked) && (bounds.width || bounds.height)) {
        const {width, height} = this.state;
        updates.ratio = findRatioForSize(bounds.width || width, bounds.height || height);
      }

      if (save) {
        this.updateSettings(updates);
      } else {
        this.setState(updates);
      }
      this.actionBarContainer.setInputValues(updates);
    } else {
      this.actionBarContainer.setInputValues(this.state);
    }
  }

  setRatio = ratio => {
    const {y, width, screenHeight} = this.state;
    const updates = {ratio};

    this.unselectApp();
    updates.height = Math.ceil(width * ratio[1] / ratio[0]);
    if (y + updates.height > screenHeight) {
      updates.height = screenHeight - y;
      updates.width = Math.ceil(updates.height * ratio[0] / ratio[1]);
    }

    this.updateSettings(updates);
    this.actionBarContainer.setInputValues(updates);
  }

  swapDimensions = () => {
    const {x, height, ratio, screenWidth} = this.state;
    const updates = {width: height};

    if (x + updates.width > screenWidth) {
      updates.width = screenWidth - x;
    }

    this.updateSettings(updates);
    this.actionBarContainer.setInputValues(updates);
    this.setRatio(ratio.reverse());
  }

  selectApp = app => {
    const {x, y, width, height, ownerName} = app;
    this.setState({selectedApp: ownerName});
    this.setBounds({x, y, width, height}, {ignoreRatioLocked: true});
  }

  unselectApp = () => {
    if (this.state.selectedApp) {
      this.setState({selectedApp: ''});
    }
  }

  enterFullscreen = () => {
    const {x, y, width, height, screenWidth, screenHeight} = this.state;
    this.unselectApp();
    this.setState({
      isFullscreen: true,
      x: 0,
      y: 0,
      width: screenWidth,
      height: screenHeight,
      showHandles: false,
      original: {x, y, width, height}
    });
  }

  exitFullscreen = () => {
    const {original} = this.state;
    this.setState({isFullscreen: false, showHandles: true, ...original});
  }

  startPicking = ({pageX, pageY}) => {
    this.unselectApp();
    this.setState({isPicking: true, original: {pageX, pageY}});
    this.cursorContainer.addCursorObserver(this.pick);
  }

  pick = ({pageX, pageY}) => {
    const {original, isPicking} = this.state;
    if (Math.abs(original.pageX - pageX) > 0 && Math.abs(original.pageY - pageY) > 0 && isPicking) {
      this.cursorContainer.removeCursorObserver(this.pick);
      this.setState({
        x: pageX,
        y: pageY,
        width: 0,
        height: 0,
        isResizing: true,
        isPicking: false,
        currentHandle: {bottom: true, right: true}
      }, () => {

      });

      this.setOriginal();
      this.cursorContainer.addCursorObserver(this.resize);
    }
  }

  stopPicking = () => {
    if (this.state.isPicking) {
      this.remote.getCurrentWindow().close();
    } else {
      this.setState({isPicking: false});
      this.cursorContainer.removeCursorObserver(this.pick);
    }
  }

  setOriginal = () => {
    const {x, y, width, height} = this.state;
    this.setState({original: {x, y, width, height}});
  }

  startResizing = currentHandle => {
    if (!this.state.isFullscreen) {
      this.unselectApp();
      this.setOriginal();
      this.setState({currentHandle, isResizing: true});
      this.cursorContainer.addCursorObserver(this.resize);
    }
  }

  stopResizing = () => {
    if (!this.state.isFullscreen && this.state.isResizing) {
      const {x, y, width, height, ratio} = this.state;
      this.setState({currentHandle: null, isResizing: false, showHandles: true, isPicking: false});
      this.cursorContainer.removeCursorObserver(this.resize);
      this.updateSettings({x, y, width, height, ratio});
    }
  }

  startMoving = ({pageX, pageY}) => {
    if (!this.state.isFullscreen) {
      this.unselectApp();
      this.setState({isMoving: true, showHandles: false, offsetX: pageX, offsetY: pageY});
      this.cursorContainer.addCursorObserver(this.move);
    }
  }

  stopMoving = () => {
    if (!this.state.isFullscreen && this.state.isMoving) {
      const {x, y} = this.state;
      this.setState({isMoving: false, showHandles: true});
      this.cursorContainer.removeCursorObserver(this.move);
      this.updateSettings({x, y});
    }
  }

  move = ({pageX, pageY}) => {
    const {x, y, offsetX, offsetY, width, height, screenWidth, screenHeight} = this.state;

    const updates = {
      offsetY: pageY,
      offsetX: pageX
    };

    if (y + pageY - offsetY + height <= screenHeight && y + pageY - offsetY >= 0) {
      updates.y = y + pageY - offsetY;
    }

    if (x + pageX - offsetX + width <= screenWidth && x + pageX - offsetX >= 0) {
      updates.x = x + pageX - offsetX;
    }

    this.setBounds(updates, {save: false});
  }

  resize = ({pageX, pageY}) => {
    const {currentHandle, x, y, width, height, original, ratio, screenWidth, screenHeight} = this.state;
    const {top, bottom, left, right} = currentHandle;

    const updates = {};

    if (top) {
      updates.y = pageY;
      updates.height = height + y - pageY;

      if (updates.height < 1) {
        updates.currentHandle = {top: false, bottom: true, left, right};
      }
    } else if (bottom) {
      updates.height = pageY - y;
      updates.y = y;

      if (updates.height < 1) {
        updates.currentHandle = {bottom: false, top: true, left, right};
      }
    }

    if (left) {
      updates.x = pageX;
      updates.width = width + x - pageX;

      if (updates.width < 1) {
        updates.currentHandle = {left: false, right: true, top, bottom};
      }
    } else if (right) {
      updates.width = pageX - x;
      updates.x = x;

      if (updates.width < 1) {
        updates.currentHandle = {right: false, left: true, top, bottom};
      }
    }

    if (this.actionBarContainer.state.ratioLocked) {
      // Check which dimension has changed the most
      if (
        (updates.width - original.width) * ratio[1] > (updates.height - original.height) * ratio[0]
      ) {
        let lockedHeight = Math.ceil(updates.width * ratio[1] / ratio[0]);

        if (top) {
          updates.y += updates.height - lockedHeight;

          if (updates.y < 0) {
            lockedHeight += updates.y;
            const lockedWidth = Math.ceil(lockedHeight * ratio[0] / ratio[1]);

            updates.y = 0;

            if (left) {
              updates.x += updates.width - lockedWidth;
            }

            updates.width = lockedWidth;
          }
        } else if (updates.y + lockedHeight > screenHeight) {
          lockedHeight = screenHeight - updates.y;
          const lockedWidth = Math.ceil(lockedHeight * ratio[0] / ratio[1]);

          if (left) {
            updates.x += updates.width - lockedWidth;
          }

          updates.width = lockedWidth;
        }

        updates.height = lockedHeight;
      } else {
        let lockedWidth = Math.ceil(updates.height * ratio[0] / ratio[1]);

        if (left) {
          updates.x += updates.width - lockedWidth;

          if (updates.x < 0) {
            lockedWidth += updates.x;
            const lockedHeight = Math.ceil(lockedWidth * ratio[1] / ratio[0]);

            updates.x = 0;

            if (top) {
              updates.y += updates.height - lockedHeight;
            }

            updates.height = lockedHeight;
          }
        } else if (updates.x + lockedWidth > screenWidth) {
          lockedWidth = screenWidth - updates.x;
          const lockedHeight = Math.ceil(lockedWidth * ratio[1] / ratio[0]);

          if (top) {
            updates.y += updates.height - lockedHeight;
          }

          updates.height = lockedHeight;
        }

        updates.width = lockedWidth;
      }
    }

    this.setBounds(updates, {save: false});
  }
}
