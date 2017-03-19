import React from 'react'

import Component from './Component'
import TrafficLights from './TrafficLights'
import TrayArrow from './TrayArrow'

let css

class WindowHeader extends Component {
  constructor() {
    super()
    css = this.css
  }
  render() {
    const {arrow, title, hide, minimize, showTrafficLights, bgColor} = this.props
    return (
      <header className="webkit-drag" style={{backgroundColor: bgColor}}>
        <TrafficLights
          show={showTrafficLights}
          hide={hide}
          minimize={minimize}
          />
        {title && <span className="title">{title}</span>}
        {arrow && <TrayArrow/>}
        <style jsx>{`
          header {
            position: relative;
            width: 100%;
            height: 1.2rem;
            text-align: center;
            border-radius: 5px 5px 0 0;
            opacity: 1;
            transition: transform .12s ease-in-out, opacity .12s ease-in-out;
            will-change: tansform, opacity;
          }

          .title {
            color: white;
            font-size: ${css.fontSizDefault};
            line-height: 2.8rem;
          }

          header.floating: {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
          }

          header.transparent {
            background: rgba(34, 34, 34, .2);
          }

          header.hidden {
            opacity: 0;
            transform: translateY(-100%);
          }

          header.bg-light {
            background-color: ${css.backgroundLight};
            box-shadow: none;
          }

          header.bg-light .title {
            color: ${css.greyDark}
          }

          header.update-notification {
            height: 5.6rem;
            background-color: ${css.green}
          }
        `}</style>
      </header>
    )
  }
}

export default WindowHeader
