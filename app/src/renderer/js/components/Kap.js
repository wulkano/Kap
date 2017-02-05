import {bindActionCreators} from 'redux'
import {connect as reduxConnect} from 'react-redux'

import * as actionCreators from '../actions'

function mapStateToProps(state) {
  return state
}

function mapDispatchToprops(containerName) {
  const creators = actionCreators[containerName]

  return dispatch => bindActionCreators(creators, dispatch)
}

export default function connect(Class, name) {
  return reduxConnect(mapStateToProps, mapDispatchToprops(name))(Class, name)
}
