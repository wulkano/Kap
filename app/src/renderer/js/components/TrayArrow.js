import classNames from 'classnames'
import React from 'react'

import loadSvg from '../util'
import Component from './Component'

let css

class TrayArrow extends Component {
  constructor() {
    super()
    css = this.css

    this.state = {svg: null}
  }

  async componentDidMount() {
    try {
      const data = await loadSvg('tray-arrow')

      this.setState({svg: data})
    } catch (err) {
      throw new Error(`Couldn't load SVGs`, err)
    }
  }

  render() {
    const className = classNames('svg', 'no-select', {hidden: !this.props.visible})
    return (
      <div className="root">
        <div
          className={className}
          dangerouslySetInnerHTML={{__html: this.state.svg}}
          onClick={this.handleCloseClick}
          />
        <style jsx>{`
          .root {
            display: flex;
            line-height: 0;
          }
          .svg {
            margin: auto;
            color: ${css.backgroundLight};
            height: 12px;
          }
        `}</style>
      </div>
    )
  }
}

export default TrayArrow
