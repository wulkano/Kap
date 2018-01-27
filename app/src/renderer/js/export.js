import {ipcRenderer, remote} from 'electron';
import EventEmitter from 'events';
import {default as createAperture, audioDevices} from 'aperture';

import {init as initErrorReporter, report as reportError} from '../../common/reporter';
import {log} from '../../common/logger';

// Note: `./` == `/app/dist/renderer/views`, not `js`
// import {handleKeyDown, validateNumericInput} from '../js/input-utils';
import {handleTrafficLightsClicks} from '../js/utils';

// const {app} = remote;

document.addEventListener('DOMContentLoaded', () => {
  // const trafficLightsWrapper = document.querySelector('.title-bar__controls');

  handleTrafficLightsClicks();
});

