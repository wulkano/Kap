import React from 'react'

import Component from './Component'
import Kap from './Kap'
import TrayArrow from './TrayArrow'
import WindowHeader from './WindowHeader'
import GlobalContainer from './GlobalContainer'

class MainWindow extends Component {

  render() {
    const {stuck: isStuck} = this.props.windows.main
    const {hide, minimize} = this.props
    return (
      <div>
        <TrayArrow visible={isStuck}/>
        <WindowHeader
          showTrafficLights={!isStuck}
          hide={hide}
          minimize={minimize}
          title="Kap"
          />
      </div>
    )
  }
}

export default GlobalContainer(Kap(MainWindow, 'mainWindow'))
