import classNames from 'classnames'
import React from 'react'

import Component from './Component'
import Kap from './Kap'
import WindowHeader from './WindowHeader'
import GlobalContainer from './GlobalContainer'
import Button from './Button'

class MainWindow extends Component {

  render() {
    const {stuck: isStuck} = this.props.windows.main
    const {hide, minimize} = this.props
    const mainClassName = classNames('webkit-drag', {'rounded-top': isStuck})
    return (
      <div>
        <WindowHeader
          arrow
          showTrafficLights={!isStuck}
          bgColor={isStuck ? 'transparent' : 'white'}
          hide={hide}
          minimize={minimize}
          />
        <main className={mainClassName}>
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
            border-radius: 0 0 5px 5px;
          }

          .rounded-top {
            border-radius: 5px;
          }
        `}</style>
      </div>
    )
  }
}

export default GlobalContainer(Kap(MainWindow, 'mainWindow'))
