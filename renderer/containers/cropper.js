import electron from 'electron';
import nearestNormalAspectRatio from 'nearest-normal-aspect-ratio';
import {Container} from 'unstated';

import {minHeight, minWidth, resizeTo, setScreenSize} from '../utils/inputs';

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
    return ratio.split(':').map(part => Number.parseInt(part, 10));
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

    const {settings} = this.remote.require('./common/settings');
    this.settings = settings;
    this.settings.getSelectedInputDeviceId = this.remote.require('./utils/devices').getSelectedInputDeviceId;

    this.state = {
      isRecording: false,
      isResizing: false,
      isMoving: false,
      isPicking: false,
      resizeFromCenter: false,
      showHandles: true,
      selectedApp: '',
      screenWidth: 0,
      screenHeight: 0,
      isActive: false,
      isReady: false,
      ratio: [1, 1],
      // Added this to keep track of cropper history to add undo button
      cropperHistory: [],
      cropperPointer: -1,
      isUndone: false,
      recordAudio: this.settings.get('recordAudio'),
      audioInputDeviceId: this.settings.getSelectedInputDeviceId()
    };

    this.settings.onDidChange('recordAudio', recordAudio => {
      this.setState({recordAudio});
    });

    this.settings.onDidChange('audioInputDeviceId', async () => {
      this.setState({audioInputDeviceId: this.settings.getSelectedInputDeviceId()});
    });
  }

  setDisplay = display => {
    const {width: screenWidth, height: screenHeight, isActive, id, cropper = {}} = display;
    const {x, y, width, height, ratio = [4, 3]} = cropper;

    setScreenSize(screenWidth, screenHeight);
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
      ratio
    });
    this.actionBarContainer.setInputValues({width, height});
  };

  willStartRecording = () => {
    this.setState({willStartRecording: true});
  };

  setRecording = () => {
    this.setState({isRecording: true});
  };

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
  };

  updateSettings = updates => {
    // If already undone, if moved again then erase everything after current pointer
    if (this.state.isUndone) {
      let newCropperHistory = this.state.cropperHistory;
      const CropperHistoryLength = this.state.cropperHistory.length;
      if (this.state.cropperPointer > -1) {
        const toBeDeleted = (CropperHistoryLength - 1) - this.state.cropperPointer;
        newCropperHistory.splice(this.state.cropperPointer + 1, toBeDeleted);
      } else {
        newCropperHistory = [];
      }

      this.setState({
        cropperHistory: newCropperHistory,
        isUndone: false
      });
    }

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
    // Added in: keep track of cropper
    this.setState({
      cropperHistory: [...this.state.cropperHistory, this.state],
      cropperPointer: this.state.cropperPointer + 1
    });

    this.setState(updates);
  };

  setSize = ({width: defaultWidth, height: defaultHeight}) => {
    let {width, height} = this.state;
    width = width || defaultWidth;
    height = height || defaultHeight;
    const updates = {width, height};
    this.settings.set('cropper', updates);
    this.setState(updates);
    this.actionBarContainer.setInputValues(updates);
  };

  bindCursor = cursorContainer => {
    this.cursorContainer = cursorContainer;
  };

  bindActionBar = actionBarContainer => {
    this.actionBarContainer = actionBarContainer;
  };

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
    } else if (this.state.width || this.state.height) {
      this.actionBarContainer.setInputValues(this.state);
    } else {
      this.actionBarContainer.setInputValues({});
    }
  };

  setRatio = ratio => {
    const {x, y, width, screenHeight} = this.state;
    const target = {width};

    this.unselectApp();
    const computedHeight = Math.ceil(width * ratio[1] / ratio[0]);
    target.height = Math.max(minHeight, Math.min(screenHeight, computedHeight));

    if (target.height !== computedHeight) {
      target.width = Math.ceil(target.height * ratio[0] / ratio[1]);
    }

    const updates = {ratio, ...resizeTo({x, y}, target)};

    this.updateSettings(updates);
    this.actionBarContainer.setInputValues(updates);
    this.actionBarContainer.toggleRatioLock(true);
  };

  swapDimensions = () => {
    const {x, y, width, height, ratio, screenHeight} = this.state;
    const target = {
      width: height,
      height: Math.min(width, screenHeight)
    };

    this.unselectApp();

    if (target.height !== width) {
      target.width = Math.ceil(target.height * ratio[1] / ratio[0]);
    }

    const updates = {ratio: ratio.reverse(), ...resizeTo({x, y}, target)};

    this.updateSettings(updates);
    this.actionBarContainer.setInputValues(updates);
  };

  selectApp = app => {
    const {x, y, width, height, ownerName} = app;
    this.setState({selectedApp: ownerName});
    this.setBounds({x, y, width, height}, {ignoreRatioLocked: true});
  };

  unselectApp = () => {
    if (this.state.selectedApp) {
      this.setState({selectedApp: ''});
    }
  };

  toggleResizeFromCenter = resizeFromCenter => {
    this.setState({resizeFromCenter});
  };

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
  };

  exitFullscreen = () => {
    const {original} = this.state;
    this.setState({isFullscreen: false, showHandles: true, ...original});
  };

  startPicking = ({pageX, pageY}) => {
    this.unselectApp();
    this.setState({isPicking: true, original: {pageX, pageY}});
    this.cursorContainer.addCursorObserver(this.pick);
  };

  pick = ({pageX, pageY}) => {
    const {original, isPicking} = this.state;
    const width = Math.abs(original.pageX - pageX);
    const height = Math.abs(original.pageY - pageY);
    if ((width > 0 || height > 0) && isPicking) {
      this.cursorContainer.removeCursorObserver(this.pick);
      const top = pageY < original.pageY;
      const left = pageX < original.pageX;
      this.setState({
        x: Math.min(pageX, original.pageX),
        y: Math.min(pageY, original.pageY),
        width,
        height,
        isResizing: true,
        isPicking: false,
        currentHandle: {top, bottom: !top, left, right: !left}
      });

      this.setOriginal();
      this.cursorContainer.addCursorObserver(this.resize);
    }
  };

  stopPicking = () => {
    if (this.state.isPicking) {
      this.remote.getCurrentWindow().close();
    } else {
      this.cursorContainer.removeCursorObserver(this.pick);
    }
  };

  setOriginal = () => {
    const {x, y, width, height} = this.state;
    this.setState({original: {x, y, width, height}});
  };

  startResizing = currentHandle => {
    if (!this.state.isFullscreen) {
      this.unselectApp();
      this.setOriginal();
      this.setState({currentHandle, isResizing: true});
      this.cursorContainer.addCursorObserver(this.resize);
    }
  };

  stopResizing = () => {
    if (!this.state.isFullscreen && this.state.isResizing) {
      const {x, y, width, height, ratio} = this.state;
      this.setState({currentHandle: null, isResizing: false, showHandles: true, isPicking: false});
      this.cursorContainer.removeCursorObserver(this.resize);
      this.setBounds({
        ...resizeTo({x, y}, {
          width: Math.max(minWidth, width),
          height: Math.max(minHeight, height)
        }),
        ratio
      });
    }
  };

  startMoving = ({pageX, pageY}) => {
    if (!this.state.isFullscreen) {
      this.unselectApp();
      this.setState({isMoving: true, showHandles: false, offsetX: pageX, offsetY: pageY});
      this.cursorContainer.addCursorObserver(this.move);
    }
  };

  stopMoving = () => {
    if (!this.state.isFullscreen && this.state.isMoving) {
      const {x, y, width, height} = this.state;
      this.setBounds({x, y, width, height});
      this.setState({isMoving: false, showHandles: true});
      this.cursorContainer.removeCursorObserver(this.move);
      // Check: this.updateSettings({x, y}); <-- do we need this? since it alreadly calls setBounds which updates Settings
    }
  };

  redo = () => {
    if (this.state.isUndone && this.state.cropperPointer < this.state.cropperHistory.length - 1) {
      const originalCropperHistory = this.state.cropperHistory;
      const currentPointer = this.state.cropperPointer + 1;
      const newState = this.state.cropperHistory[currentPointer];
      this.setState(newState);
      this.setState({
        cropperHistory: originalCropperHistory,
        cropperPointer: currentPointer,
        isUndone: true
      });

      const {x, y, width, height, ratio, displayId} = this.state;

      this.settings.set('cropper', {
        x,
        y,
        width,
        height,
        ratio,
        displayId
      });
    }
  };

  undo = () => {
    if (this.state.cropperPointer > 0) {
      const currentPointer = this.state.cropperPointer - 1;
      const originalCropperHistory = this.state.cropperHistory;
      const newState = this.state.cropperHistory[currentPointer];
      this.setState(newState);
      this.setState({
        isUndone: true,
        cropperHistory: originalCropperHistory,
        cropperPointer: currentPointer
      });
      const {x, y, width, height, ratio, displayId} = this.state;

      this.settings.set('cropper', {
        x,
        y,
        width,
        height,
        ratio,
        displayId
      });
    }
  };

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
  };

  resize = ({pageX, pageY}) => {
    const {currentHandle, x, y, width, height, original, ratio, screenWidth, screenHeight, resizeFromCenter} = this.state;
    const {top, bottom, left, right} = currentHandle;
    const {ratioLocked} = this.actionBarContainer.state;
    const updates = {currentHandle: {top, bottom, right, left}};

    if (top) {
      updates.y = pageY;
      updates.height = height + y - pageY;

      if (resizeFromCenter) {
        updates.height = Math.min((2 * (screenHeight - y)) - height, updates.height + y - pageY);
        updates.y = y - ((updates.height - height) / 2);
      }
    } else if (bottom) {
      updates.height = pageY - y;
      updates.y = y;

      if (resizeFromCenter) {
        updates.y = Math.max(0, y + height - updates.height);
        updates.height = height + (2 * (y - updates.y));
      }
    }

    if (updates.height !== undefined && updates.height < 0 && !ratioLocked) {
      updates.y += updates.height;
      updates.height = -updates.height;
      updates.currentHandle.bottom = !bottom;
      updates.currentHandle.top = !top;
    }

    if (left) {
      updates.x = pageX;
      updates.width = width + x - pageX;

      if (resizeFromCenter) {
        updates.width = Math.min((2 * (screenWidth - x)) - width, updates.width + x - pageX);
        updates.x = x - ((updates.width - width) / 2);
      }
    } else if (right) {
      updates.width = pageX - x;
      updates.x = x;

      if (resizeFromCenter) {
        updates.x = Math.max(0, x + width - updates.width);
        updates.width = width + (2 * (x - updates.x));
      }
    }

    if (updates.width !== undefined && updates.width < 0 && !ratioLocked) {
      updates.x += updates.width;
      updates.width = -updates.width;
      updates.currentHandle.left = !left;
      updates.currentHandle.right = !right;
    }

    if (ratioLocked) {
      if (updates.width < 0 && updates.height < 0) {
        updates.currentHandle = {bottom: !bottom, top: !top, left: !left, right: !right};
      }

      // Check which dimension has changed the most
      if (
        (updates.width - original.width) * ratio[1] > (updates.height - original.height) * ratio[0]
      ) {
        let lockedHeight = Math.ceil(updates.width * ratio[1] / ratio[0]);

        if (resizeFromCenter) {
          updates.y += (updates.height - lockedHeight) / 2;

          if (updates.y < 0 || updates.y + lockedHeight > screenHeight) {
            if (updates.y < 0) {
              lockedHeight += updates.y * 2;
              updates.y = 0;
            } else {
              lockedHeight -= (lockedHeight - (screenHeight - updates.y)) * 2;
              updates.y = screenHeight - lockedHeight;
            }

            const lockedWidth = Math.ceil(lockedHeight * ratio[0] / ratio[1]);

            updates.x += (updates.width - lockedWidth) / 2;
            updates.width = lockedWidth;
          }
        } else if (top) {
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

        if (resizeFromCenter) {
          updates.x += (updates.width - lockedWidth) / 2;

          if (updates.x < 0 || updates.x + lockedWidth > screenWidth) {
            if (updates.x < 0) {
              lockedWidth += updates.x * 2;
              updates.x = 0;
            } else {
              lockedWidth -= (lockedWidth - (screenWidth - updates.x)) * 2;
              updates.x = screenWidth - lockedWidth;
            }

            const lockedHeight = Math.ceil(lockedWidth * ratio[1] / ratio[0]);

            updates.y += (updates.height - lockedHeight) / 2;
            updates.height = lockedHeight;
          }
        } else if (left) {
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
  };
}
