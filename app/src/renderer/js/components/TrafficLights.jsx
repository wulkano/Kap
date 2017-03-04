import classNames from 'classnames'
import React from 'react'

import loadSvg from '../util'

import Component from './Component'

class TrafficLights extends Component {
  constructor() {
    super()
    this.state = {svgs: {}, a: []}

    this.handleCloseClick = this.handleCloseClick.bind(this)
    this.handleMinimizeClick = this.handleMinimizeClick.bind(this)
  }

  async componentDidMount() {
    const data = {}

    try {
      data.close = await loadSvg('traffic-light-close')
      data.minimize = await loadSvg('traffic-light-minimize')
      data.disabled = await loadSvg('traffic-light-disabled')

      this.setState({svgs: data, a: [1, 2, 3]})
    } catch (err) {
      throw new Error(`Couldn't load SVGs`, err)
    }
  }

  handleCloseClick() {
    if (this.props.close) {
      this.props.close()
    } else if (this.props.hide) {
      this.props.hide()
    }
  }

  handleMinimizeClick() {
    this.props.minimize()
  }

  render() {
    const {svgs} = this.state
    const className = classNames('svg', 'no-select', {hidden: !this.props.show})
    return (
      <div className="root">
        <div
          className={className}
          dangerouslySetInnerHTML={{__html: svgs.close || null}}
          onClick={this.handleCloseClick}
          />
        <div
          className={className}
          dangerouslySetInnerHTML={{__html: svgs.minimize || null}}
          onClick={this.handleMinimizeClick}
          />
        <div
          className={className}
          dangerouslySetInnerHTML={{__html: svgs.disabled || null}}
          />
        <style jsx>{`
          .root {
            position: absolute;
            left: 8px;
            transition: all .3s ease;

            height: 28px;
            display: flex;
            align-items: center;
          }

          .svg {
            margin-right: 8px;
          }

          .svg {
            cursor: default !important;
          }

          .svg * {
            cursor: default !important;
          }

          .root:hover .svg :global(g>g), .root:hover .svg :global(g>path) {
            opacity: 1 !important;
          }
        `}</style>
      </div>
    )
  }
}

TrafficLights.propTypes = {
  show: React.PropTypes.bool.isRequired
}

export default TrafficLights
