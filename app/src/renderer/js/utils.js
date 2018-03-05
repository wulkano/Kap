const {ipcRenderer, remote} = require('electron');

const isVisible = el => {
  const classList = el.classList;

  return !(classList.contains('invisible') || classList.contains('hidden'));
};

// TODO: Get rid of all usage of this so we can use `$` for jQuery
const $ = selector => {
  return document.querySelector(selector);
};

const handleTrafficLightsClicks = ({wrapper = $('.title-bar__controls'), hide = false} = {}) => {
  const hideWindowBtn = hide ? wrapper.querySelector('.hide-window') : wrapper.querySelector('.close-window');
  const minimizeWindowBtn = wrapper.querySelector('.minimize-window');

  hideWindowBtn.addEventListener('click', () => {
    if (isVisible(wrapper)) {
      if (remote.getCurrentWindow() === remote.app.kap.editorWindow) {
        ipcRenderer.send('close-editor-window');
        return;
      }

      ipcRenderer.send(hide ? 'hide-window' : 'close-window');
    }
  });

  minimizeWindowBtn.addEventListener('click', () => {
    if (isVisible(wrapper)) {
      ipcRenderer.send('minimize-window');
    }
  });
};

const disposeObservers = observers => {
  for (const observer of observers) {
    observer.dispose();
  }
};

const getRelativeLeft = ({element, parent}) => {
  const {left: parentLeft} = parent.getBoundingClientRect();
  const {left: elementLeft} = element.getBoundingClientRect();

  return elementLeft - parentLeft - 1;
};

const moveShimToButton = ({shim, button}) => {
  const left = getRelativeLeft({
    element: button,
    parent: button.parentNode
  });

  shim.style.transform = `translateX(${left}px)`;
};

const setShimBorderRadius = ({shim, activeButton, buttonGroupArray}) => {
  const index = buttonGroupArray.indexOf(activeButton);

  if (index === 0) {
    shim.style.borderRadius = '4px 0 0 4px';
  } else if (index === buttonGroupArray.length - 1) {
    shim.style.borderRadius = '0 4px 4px 0';
  } else {
    shim.style.borderRadius = '';
  }
};

const handleActiveButtonGroup = ({buttonGroup}) => {
  const shim = buttonGroup.querySelector('.active-shim');
  const buttons = Array.from(buttonGroup.querySelectorAll('button'));
  const buttonDimensions = {
    width: buttons[0].offsetWidth,
    height: buttons[0].offsetHeight
  };

  shim.style.width = `${buttonDimensions.width}px`;
  shim.style.height = `${buttonDimensions.height}px`;

  const activeButton = buttons.find(el => el.classList.contains('active'));
  moveShimToButton({shim, button: activeButton});
  // At this point we don't need this class anymore
  activeButton.classList.remove('active');
  setShimBorderRadius({
    shim,
    buttonGroupArray: buttons,
    activeButton
  });

  buttons.map(button => {
    button.addEventListener('click', () => {
      moveShimToButton({shim, button});

      setShimBorderRadius({
        shim,
        buttonGroupArray: buttons,
        activeButton: button
      });
    });

    return null;
  });
};

const getTimestampAtEvent = (event, videoDuration) => {
  const rect = event.target.getBoundingClientRect();
  const xPositionInTrimmer = event.pageX - rect.left;

  return videoDuration * (xPositionInTrimmer / rect.width); // Calculated time in seconds where the click happened
};

export {handleTrafficLightsClicks, isVisible, $, disposeObservers, handleActiveButtonGroup, getTimestampAtEvent};
