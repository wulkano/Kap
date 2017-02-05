import * as constants from '../constants'

export default function mainReducer(state, action) {
  switch (action.type) {
    case constants.MAIN_WINDOW_STICK_TO_MENUBAR: {
      return Object.assign({}, state, {
        windows: {
          main: {
            stuck: true
          }
        }
      })
    }

    case constants.MAIN_WINDOW_UNSTICK_FROM_MENUBAR: {
      return Object.assign({}, state, {
        windows: {
          main: {
            stuck: false
          }
        }
      })
    }

    default: {
      return state
    }
  }
}
