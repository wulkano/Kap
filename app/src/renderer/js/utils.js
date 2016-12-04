const {ipcRenderer} = require('electron');

function isVisible(el) {
  const classList = el.classList;

  return !(classList.contains('invisible') || classList.contains('hidden'));
}

function $(selector) {
  return document.querySelector(selector);
}

function handleTrafficLightsClicks({wrapper = $('.title-bar__controls'), hide = false} = {}) {
  const hideWindowBtn = hide ? wrapper.querySelector('.hide-window') : wrapper.querySelector('.close-window');
  const minimizeWindowBtn = wrapper.querySelector('.minimize-window');

  hideWindowBtn.addEventListener('click', () => {
    if (isVisible(wrapper)) {
      ipcRenderer.send(hide ? 'hide-window' : 'close-window');
    }
  });

  minimizeWindowBtn.addEventListener('click', () => {
    if (isVisible(wrapper)) {
      ipcRenderer.send('minimize-window');
    }
  });
}

export {handleTrafficLightsClicks, isVisible, $};
