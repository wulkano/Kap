const {ipcRenderer} = require('electron');

function isVisible(el) {
  const classList = el.classList;

  return !(classList.contains('invisible') || classList.contains('hidden'));
}

function handleTrafficLightsClicks(wrapper) {
  const hideWindowBtn = wrapper.querySelector('.hide-window');
  const minimizeWindowBtn = wrapper.querySelector('.minimize-window');

  hideWindowBtn.addEventListener('click', () => {
    if (isVisible(wrapper)) {
      ipcRenderer.send('hide-window');
    }
  });

  minimizeWindowBtn.addEventListener('click', () => {
    if (isVisible(wrapper)) {
      ipcRenderer.send('minimize-window');
    }
  });
}

function $(selector) {
  return document.querySelector(selector);
}

export {handleTrafficLightsClicks, isVisible, $};
