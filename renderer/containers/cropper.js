import electron from 'electron';
import nearestNormalAspectRatio from 'nearest-normal-aspect-ratio';
import {Container} from 'unstated';

const {width: screenWidth, height: screenHeight} = (electron.screen && electron.screen.getPrimaryDisplay().bounds) || {};

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
    this.dimensions = this.settings.get('dimensions');

    this.state = {
      ...this.dimensions,
      resizing: false,
      moving: false,
      picking: false,
      showHandles: true,
      screenWidth,
      screenHeight,
      appSelected: ''
    };
  }

  updateSettings = updates => {
    this.dimensions = {...this.dimensions, ...updates};
    this.settings.set('dimensions', this.dimensions);
    this.setState(updates);
  }

  bindCursor = cursorContainer => {
    this.cursorContainer = cursorContainer;
  }

  bindActionBar = actionBarContainer => {
    this.actionBarContainer = actionBarContainer;
  }

  setBounds = (bounds, ignoreRatioLocked) => {
    const updates = bounds;

    if ((!this.actionBarContainer.state.ratioLocked || ignoreRatioLocked) && (bounds.width || bounds.height)) {
      const {width, height} = this.state;
      updates.ratio = findRatioForSize(bounds.width || width, bounds.height || height);
    }

    this.updateSettings(updates);
  }

  setRatio = ratio => {
    const {y, width} = this.state;
    const updates = {ratio};

    this.unselectApp();
    updates.height = Math.ceil(width * ratio[1] / ratio[0]);
    if (y + updates.height > screenHeight) {
      updates.height = screenHeight - y;
      updates.width = Math.ceil(updates.height * ratio[0] / ratio[1]);
    }

    this.updateSettings(updates);
  }

  swapDimensions = () => {
    const {x, height, ratio} = this.state;
    const updates = {width: height};

    if (x + updates.width > screenWidth) {
      updates.width = screenWidth - x;
    }

    this.updateSettings(updates);
    this.setRatio(ratio.reverse());
  }

  selectApp = app => {
    const {x, y, width, height, ownerName} = app;
    this.setState({appSelected: ownerName});
    this.setBounds({x, y, width, height}, true);
  }

  unselectApp = () => {
    if (this.state.appSelected) {
      this.setState({appSelected: ''});
    }
  }

  enterFullscreen = () => {
    const {x, y, width, height} = this.state;
    this.unselectApp();
    this.setState({
      fullscreen: true,
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
    this.setState({fullscreen: false, showHandles: true, ...original});
  }

  startPicking = () => {
    this.unselectApp();
    this.setState({picking: true});
    this.cursorContainer.addCursorObserver(this.pick);
  }

  pick = ({pageX, pageY}) => {
    if (!this.state.picked) {
      this.cursorContainer.removeCursorObserver(this.pick);
      this.setState({
        x: pageX,
        y: pageY,
        width: 0,
        height: 0,
        resizing: true,
        picking: false,
        currentHandle: {bottom: true, right: true}
      });
      this.setOriginal();
      this.cursorContainer.addCursorObserver(this.resize);
    }
  }

  stopPicking = () => {
    this.setState({picking: false});
    this.cursorContainer.removeCursorObserver(this.pick);
  }

  setOriginal = () => {
    const {x, y, width, height} = this.state;
    this.setState({original: {x, y, width, height}});
  }

  startResizing = currentHandle => {
    if (!this.state.fullscreen) {
      this.unselectApp();
      this.setOriginal();
      this.setState({currentHandle, resizing: true});
      this.cursorContainer.addCursorObserver(this.resize);
    }
  }

  stopResizing = () => {
    if (!this.state.fullscreen && this.state.resizing) {
      this.setState({currentHandle: null, resizing: false, showHandles: true, picking: false});
      this.cursorContainer.removeCursorObserver(this.resize);
    }
  }

  startMoving = ({pageX, pageY}) => {
    if (!this.state.fullscreen) {
      this.unselectApp();
      this.setState({moving: true, showHandles: false, offsetX: pageX, offsetY: pageY});
      this.cursorContainer.addCursorObserver(this.move);
    }
  }

  stopMoving = () => {
    if (!this.state.fullscreen && this.state.moving) {
      this.setState({moving: false, showHandles: true});
      this.cursorContainer.removeCursorObserver(this.move);
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

    this.setBounds(updates);
  }

  resize = ({pageX, pageY}) => {
    const {currentHandle, x, y, width, height, original, ratio} = this.state;
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

    this.setBounds(updates);
  }
}
