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

const mainWindow = {
  stickToMenubar,
  unStickFromMenubar
}

// eslint-disable-next-line import/prefer-default-export
export {mainWindow}
