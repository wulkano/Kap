import React from 'react'

// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
import eightpoint from 'raw-loader!eightpoint/dist/eight.min.css'

import Component from './Component'
import Kap from './Kap'
import TrayArrow from './TrayArrow'
import WindowHeader from './WindowHeader'

// webpack stuff
/* eslint-disable import/no-unassigned-import */
require('../../css/main.css')
/* eslint-enable import/no-unassigned-import */

let css

class MainWindow extends Component {
  constructor() {
    super()
    css = this.css
  }

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
        </main>
        <style jsx global>{`
          ${eightpoint}
          body {
            color: ${css.colorSecondary};
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue";
            overflow: hidden;
            letter-spacing: -.010rem;
            border-radius: 5px;
            overflow: hidden;
            font-size: 1.4rem;
          }

          .webkit-drag {
            -webkit-app-region: drag;
            cursor: -webkit-grab;
          }

          .hidden {
            opacity: 0 !important;
            pointer-events: none !important;
          }

          .no-select {
            -webkit-user-select: none !important;
            cursor: default !important;
          }
        `}</style>
      </div>
    )
  }
}

export default Kap(MainWindow, 'mainWindow')
