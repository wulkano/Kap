'use strict';

const {homedir} = require('os');
const Store = require('electron-store');

const {audioDevices} = require('aperture');

const store = new Store({
  defaults: {
    kapturesDir: `${homedir()}/Movies/Kaptures`,
    allowAnalytics: true,
    showCursor: true,
    highlightClicks: false,
    hideDesktopIcons: false,
    record60fps: false,
    loopExports: true,
    recordKeyboardShortcut: true,
    doNotDisturb: false,
    recordAudio: false,
    audioInputDeviceId: null,
    cropperShortcut: {
      metaKey: true,
      altKey: false,
      ctrlKey: false,
      shiftKey: true,
      character: '5'
    }
  }
});

store.set('cropper', {});
store.set('actionBar', {});

const audioInputDeviceId = store.get('audioInputDeviceId');

(async () => {
  const devices = await audioDevices();

  if (!devices.some(device => device.id === audioInputDeviceId)) {
    const [device] = devices;
    if (device) {
      store.set('audioInputDeviceId', device.id);
    }
  }
})();

module.exports = store;
