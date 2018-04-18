// Packages
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

class CropperContainer extends Container {
  state = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    resizing: false,
    moving: false,
    picking: false,
    showHandles: false,
    screenWidth,
    screenHeight
  }

  enterFullscreen = () => {
    const {x, y, width, height} = this.state;
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

  bindCursor = cursorContainer => {
    this.cursorContainer = cursorContainer;
  }

  bindActionBar = actionBarContainer => {
    this.actionBarContainer = actionBarContainer;
  }

  startPicking = () => {
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

    this.setState(updates);
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

      if (updates.width < 1) {
        updates.currentHandle = {right: false, left: true, top, bottom};
      }
    }

    if (this.actionBarContainer.state.ratioLocked) {
      // Check which dimension has changed the most
      if (
        (updates.width - original.width) * ratio[1] > (updates.height - original.height) * ratio[0]
      ) {
        const lockedHeight = Math.ceil(updates.width * ratio[1] / ratio[0]);

        if (top) {
          updates.y += updates.height - lockedHeight;
        }

        updates.height = lockedHeight;
      } else {
        const lockedWidth = Math.ceil(updates.height * ratio[0] / ratio[1]);

        if (left) {
          updates.x += updates.width - lockedWidth;
        }

        updates.width = lockedWidth;
      }
    } else {
      updates.ratio = findRatioForSize(updates.width, updates.height);
    }

    this.setState(updates);
  }
}

export default CropperContainer;
