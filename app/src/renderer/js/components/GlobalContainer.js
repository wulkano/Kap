import React from 'react'

// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
import eightpoint from 'raw-loader!eightpoint/dist/eight.min.css'

import Component from './Component'

let css

export default Child => {
  const GlobalContainer = class extends Component {

    constructor() {
      super()
      css = this.css
    }
    render() {
      return (
        <div>
          <Child/>
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

  return GlobalContainer
}
