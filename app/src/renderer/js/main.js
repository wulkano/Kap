import {createStore} from 'redux'
import {Provider} from 'react-redux'
import React from 'react'
import {render} from 'react-dom'

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

render(
  <Provider store={store}>
    <MainWindow/>
  </Provider>,
  document.getElementById('mount')
)
