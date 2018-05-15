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
    recordKeyboardShortcut: true,
    doNotDisturb: false,
    recordAudio: false,
    audioInputDeviceId: null
  }
});

store.set('cropper', {});
store.set('actionBar', {});

const audioInputDeviceId = store.get('audioInputDeviceId');

audioDevices().then(audioDevices => {
  if (!audioDevices.find(device => device.id === audioInputDeviceId)) {
    const deviceId = audioDevices[0] && audioDevices[0].id;
    store.set('audioInputDeviceId', deviceId);
  }
});

module.exports = store;
