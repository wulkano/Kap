import React from 'react'
import Component from './Component'
import TrayArrow from './TrayArrow'

// webpack stuff
/* eslint-disable import/no-unassigned-import */
require('../../css/main.css')
/* eslint-enable import/no-unassigned-import */

let css

export default class MainWindow extends Component {
  constructor() {
    super()
    css = this.css
  }

  render() {
    return (
      <div>
        <div style={{width: '100%', height: '100%', background: css.blue}}>
          <h2>Kap + React = ❤️</h2>
        </div>
        <style jsx global>{`
          body {
            color: ${css.colorSecondary};
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue";
            overflow: hidden;
            letter-spacing: -.010rem;
            border-radius: 5px;
            overflow: hidden;
            font-size: 1.4rem;
          }
        `}</style>
      </div>
    )
  }
}
