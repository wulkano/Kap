import {bindActionCreators} from 'redux'
import {connect as reduxConnect} from 'react-redux'

import * as windowActions from '../actions/windows'

function mapStateToProps(state) {
  return state
}

function mapDispatchToprops(dispatch) {
  return bindActionCreators(windowActions, dispatch)
}

export default function connect(Class) {
  return reduxConnect(mapStateToProps, mapDispatchToprops)(Class)
}
