import {ipcRenderer} from 'electron'

import * as constants from '../constants'

function stickToMenubar() {
  return {
    type: constants.MAIN_WINDOW_STICK_TO_MENUBAR
  }
}

function unStickFromMenubar() {
  return {
    type: constants.MAIN_WINDOW_UNSTICK_FROM_MENUBAR
  }
}

function close() {
  ipcRenderer.send('close-window')
  return {
    type: constants.MAIN_WINDOW_CLOSE
  }
}

function hide() {
  ipcRenderer.send('hide-window')
  return {
    type: constants.MAIN_WINDOW_HIDE
  }
}

function minimize() {
  ipcRenderer.send('minimize-window')
  return {
    type: constants.MAIN_WINDOW_MINIMIZE
  }
}

const mainWindow = {
  stickToMenubar,
  unStickFromMenubar,
  close,
  hide,
  minimize
}

// eslint-disable-next-line import/prefer-default-export
export {mainWindow}
