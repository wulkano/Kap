// Packages
import electron from 'electron';
import _ from 'lodash';

const {width: screenWidth, height: screenHeight} = (electron.screen && electron.screen.getPrimaryDisplay().bounds) || {};
const debounceTimeout = 500;

// Shake
const shake = el => {
  el.classList.add('shake');

  el.addEventListener('webkitAnimationEnd', () => {
    el.classList.remove('shake');
  });

  return true;
};

const handleWidthInput = _.debounce(({x, y, setBounds, ratioLocked, ratio, value, widthInput, heightInput}) => {
  const updates = {};

  if (value.match(/^\d+$/)) {
    const val = parseInt(value, 10);

    if (val <= 0) {
      shake(widthInput);
      updates.width = 1;
    } else if (x + val > screenWidth) {
      shake(widthInput);
      updates.width = screenWidth - x;
    } else {
      updates.width = val;
    }

    if (ratioLocked) {
      updates.height = Math.ceil(updates.width * ratio[1] / ratio[0]);

      if (y + updates.height > screenHeight) {
        shake(heightInput);
        shake(widthInput);
        updates.height = screenHeight - y;
        updates.width = Math.ceil(updates.height * ratio[0] / ratio[1]);
      }
    }
  } else {
    // If it's not an integer keep last valid value
    shake(widthInput);
  }

  setBounds(updates);
}, debounceTimeout);

const handleHeightInput = _.debounce(({x, y, setBounds, ratioLocked, ratio, value, widthInput, heightInput}) => {
  const updates = {};

  if (value.match(/^\d+$/)) {
    const val = parseInt(value, 10);

    if (val <= 0) {
      shake(heightInput);
      updates.height = 1;
    } else if (y + val > screenHeight) {
      shake(heightInput);
      updates.height = screenHeight - y;
    } else {
      updates.height = val;
    }

    if (ratioLocked) {
      updates.width = Math.ceil(updates.height * ratio[0] / ratio[1]);

      if (x + updates.width > screenWidth) {
        shake(widthInput);
        shake(heightInput);
        updates.width = screenWidth - x;
        updates.height = Math.ceil(updates.width * ratio[1] / ratio[0]);
      }
    }
  } else {
    // If it's not an integer keep last valid value
    shake(heightInput);
  }

  setBounds(updates);
}, debounceTimeout);

export {
  handleWidthInput,
  handleHeightInput
};
