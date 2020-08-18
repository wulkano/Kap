import electron from 'electron';
import _ from 'lodash';

let screenWidth = 0;
let screenHeight = 0;

export const setScreenSize = (width, height) => {
  screenWidth = width;
  screenHeight = height;
};

const {remote} = electron;
const debounceTimeout = 500;
export const minWidth = 20;
export const minHeight = 20;

export const shake = (element, {className = 'shake'} = {}) => {
  element.classList.add(className);

  element.addEventListener('animationend', () => {
    element.classList.remove(className);
  }, {once: true});

  return true;
};

export const resizeTo = (bounds, target) => {
  const {x, y} = bounds;
  return {
    width: target.width,
    x: Math.min(x, screenWidth - target.width),
    height: target.height,
    y: Math.min(y, screenHeight - target.height)
  };
};

const handleWidthInput = _.debounce(({
  bounds,
  setBounds,
  ratioLocked,
  ratio,
  value,
  widthInput,
  heightInput,
  ignoreEmpty = true
}) => {
  const target = {};

  if (value === '' && ignoreEmpty) {
    return;
  }

  if (value.match(/^\d+$/)) {
    const integer = Number.parseInt(value, 10);

    target.width = Math.max(minWidth, Math.min(screenWidth, integer));
    if (target.width !== integer) {
      shake(widthInput.current);
    }

    if (ratioLocked) {
      const computedHeight = Math.ceil(target.width * ratio[1] / ratio[0]);
      target.height = Math.max(minHeight, Math.min(screenHeight, computedHeight));

      if (target.height !== computedHeight) {
        shake(widthInput.current);
        shake(heightInput.current);
        target.width = Math.ceil(target.height * ratio[0] / ratio[1]);
      }
    } else if (bounds.height) {
      target.height = bounds.height;
    } else {
      target.height = minHeight;
    }

    setBounds(resizeTo(bounds, target));
  } else {
    // If it's not an integer keep last valid value
    shake(widthInput.current);
    setBounds();
  }
}, debounceTimeout);

const handleHeightInput = _.debounce(({
  bounds,
  setBounds,
  ratioLocked,
  ratio,
  value,
  widthInput,
  heightInput,
  ignoreEmpty = true
}) => {
  const target = {};

  if (value === '' && ignoreEmpty) {
    return;
  }

  if (value.match(/^\d+$/)) {
    const integer = Number.parseInt(value, 10);

    target.height = Math.max(minHeight, Math.min(screenHeight, integer));
    if (target.height !== integer) {
      shake(heightInput.current);
    }

    if (ratioLocked) {
      const computedWidth = Math.ceil(target.height * ratio[0] / ratio[1]);
      target.width = Math.max(minWidth, Math.min(screenWidth, computedWidth));

      if (target.width !== computedWidth) {
        shake(widthInput.current);
        shake(heightInput.current);
        target.height = Math.ceil(target.width * ratio[1] / ratio[0]);
      }
    } else if (bounds.width) {
      target.width = bounds.width;
    } else {
      target.width = minWidth;
    }

    setBounds(resizeTo(bounds, target));
  } else {
    // If it's not an integer keep last valid value
    shake(heightInput.current);
    setBounds();
  }
}, debounceTimeout);

export const RATIOS = [
  '16:9',
  '5:4',
  '5:3',
  '4:3',
  '3:2',
  '1:1'
];

const buildAspectRatioMenu = ({setRatio, ratio}) => {
  if (!remote) {
    return;
  }

  const {Menu, MenuItem} = remote;
  const selectedRatio = ratio.join(':');
  const menu = new Menu();

  for (const r of RATIOS) {
    menu.append(
      new MenuItem({
        label: r,
        type: 'radio',
        checked: r === selectedRatio,
        click: () => setRatio(r.split(':').map(d => Number.parseInt(d, 10)))
      })
    );
  }

  const customOption = RATIOS.includes(selectedRatio) ? {
    label: 'Custom',
    type: 'radio',
    checked: false,
    enabled: false
  } : {
    label: `Custom ${selectedRatio}`,
    type: 'radio',
    checked: true
  };

  menu.append(new MenuItem(customOption));
  return menu;
};

const handleInputKeyPress = (onChange, min, max) => event => {
  if (event.key === 'Enter') {
    return onChange(event, {ignoreEmpty: false});
  }

  // Don't let shift key lock aspect ratio
  if (event.key === 'Shift') {
    event.stopPropagation();
  }

  const multiplier = event.shiftKey ? 10 : 1;
  const parsedValue = Number.parseInt(event.currentTarget.value, 10);
  if (parsedValue === NaN) {
    return;
  }

  // Fake an onChange event
  if (event.key === 'ArrowUp') {
    event.currentTarget.value = `${Math.min(parsedValue + multiplier, max)}`;
    onChange(event);
  } else if (event.key === 'ArrowDown') {
    event.currentTarget.value = `${Math.max(parsedValue - multiplier, min)}`;
    onChange(event);
  }
};

const handleKeyboardActivation = (onClick, {isMenu} = {}) => event => {
  if (
    (isMenu && event.key === 'ArrowDown') ||
    (!isMenu && ['Enter', ' '].includes(event.key))
  ) {
    event.preventDefault();
    if (onClick) {
      onClick(event);
    }
  }
};

export {
  handleWidthInput,
  handleHeightInput,
  buildAspectRatioMenu,
  handleInputKeyPress,
  handleKeyboardActivation
};
