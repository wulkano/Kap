'use strict';
const {homedir} = require('os');
const Store = require('electron-store');

module.exports = new Store({
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
    audioInputDeviceId: null,
    dimensions: {
      x: 128,
      y: 128,
      height: 512,
      width: 512,
      ratio: [1, 1]
    },
    actionBar: {
      ratioLocked: false,
      advanced: false
    }
  }
});
