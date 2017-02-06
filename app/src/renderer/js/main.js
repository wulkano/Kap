import {ipcRenderer} from 'electron'

import {createStore} from 'redux'
import {Provider} from 'react-redux'
import React from 'react'
import {render} from 'react-dom'

import {mainWindow as actions} from './actions'
import mainReducer from './reducers'
import MainWindow from './components/MainWindow'

const initialState = {
  windows: {
    main: {
      stuck: true
    }
  }
}

const store = createStore(mainReducer, initialState)

ipcRenderer.on('stick-to-menubar', () => store.dispatch(actions.stickToMenubar()))
ipcRenderer.on('unstick-from-menubar', () => store.dispatch(actions.unStickFromMenubar()))

render(
  <Provider store={store}>
    <MainWindow/>
  </Provider>,
  document.getElementById('mount')
)
