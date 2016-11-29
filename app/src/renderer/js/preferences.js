import {remote} from 'electron';

// note: `./` == `/app/dist/renderer/views`, not `js`
import {handleTrafficLightsClicks} from '../js/utils';

const {app, dialog, getCurrentWindow} = remote;

document.addEventListener('DOMContentLoaded', () => {
  // Element definitions
  const chooseSaveDirectoryBtn = document.querySelector('.js-choose-save');
  const header = document.querySelector('header');
  const trafficLightsWrapper = document.querySelector('.title-bar__controls');

  const electronWindow = getCurrentWindow();

  handleTrafficLightsClicks(trafficLightsWrapper);
  electronWindow.setSheetOffset(header.offsetHeight);

  chooseSaveDirectoryBtn.onclick = function () {
    const location = dialog.showOpenDialog(electronWindow, {properties: ['openDirectory']});
    if (location) {
      app.settings.set('kapturesDir', location[0]);
    }
  };
});
