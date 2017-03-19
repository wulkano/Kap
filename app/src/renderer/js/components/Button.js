import classNames from 'classnames'
import React from 'react'

import Component from './Component'

export default class Button extends Component {

  render() {
    const {bgColor, borderColor, color, child, roundedCorners, width} = this.props
    const style = {
      backgroundColor: bgColor,
      color,
      width,
      border: `1px solid ${borderColor}`
    }
    const className = classNames({
      rounded: roundedCorners === 'all',
      'rounded-left': roundedCorners === 'left',
      'rounded-right': roundedCorners === 'right'
    })
    return (
      <div>
        <button className={className} style={style}>
          <span>{child}</span>
        </button>
        <style jsx>{`
          button {
            height: 3.2rem;
            border: 0
          }

          .rounded {
            border-radius: 5px;
          }

          .rounded-left {
            border-radius: 5px 0 0 5px
          }

          .rounded-right {
            border-radius: 0 5px 5px 0
          }

          `}</style>
      </div>
    )
  }
}
