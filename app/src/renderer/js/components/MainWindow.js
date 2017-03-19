import classNames from 'classnames'
import React from 'react'

import Component from './Component'
import Kap from './Kap'
import TrayArrow from './TrayArrow'
import WindowHeader from './WindowHeader'
import GlobalContainer from './GlobalContainer'
import Button from './Button'

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
        <main>
          <Button
            bgColor="#007AFF"
            borderColor="#007AFF"
            color="white"
            child="GIF"
            roundedCorners="all"
            width="7.2rem"
            />
        </main>
        <style jsx>{`
          main {
            background-color: white;
            padding: 1.6rem;
          }
        `}</style>
      </div>
    )
  }
}

export default GlobalContainer(Kap(MainWindow, 'mainWindow'))
