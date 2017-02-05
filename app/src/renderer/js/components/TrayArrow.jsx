import React from 'react'

import Component from './Component'

let css

class TrayArrow extends Component {
  constructor() {
    super()
    css = this.css
  }

  render() {
    return (
      <div>
        <div className={`tray-arrow ${!this.props.visible && 'invisible'}`}/>
        <style jsx>{`
          .tray-arrow {
            margin: auto;
            width: 0;
            height: 0;
            border-right: 1rem solid transparent;
            border-bottom: 1rem solid ${css.backgroundLight};
            border-left: 1rem solid transparent;
            transition: all .3s ease;
          }
          .invisible {
            border-bottom: 1rem solid transparent
          }
        `}</style>
      </div>
    )
  }
}

TrayArrow.propTypes = {
  visible: React.PropTypes.bool.isRequired
}

export default TrayArrow
