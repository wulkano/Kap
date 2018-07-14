import React from 'react';
import PropTypes from 'prop-types';

import {TooltipIcon} from '../../../vectors';

class Slider extends React.Component {
  state = {
    isOpen: false
  }

  show = () => this.setState({isOpen: true})

  hide = () => this.setState({isOpen: false})

  handleChange = event => {
    const {onChange} = this.props;
    onChange(event.target.value, event.target);
  }

  render() {
    const {value, max, min} = this.props;
    const {isOpen} = this.state;

    return (
      <div className="container">
        { isOpen && <div className="overlay" onClick={this.hide}/> }
        <input type="text" className="value" value={value} onChange={this.handleChange} onFocus={this.show}/>
        {
          isOpen && (
            <div className="popup" onClick={event => event.stopPropagation()}>
              <input type="range" className="slider" onChange={this.handleChange} min={min} max={max} step={1} value={value}/>
              <div className="arrow">
                <TooltipIcon fill="rgba(255,255,255,0.85)" hoverFill="rgba(255,255,255,0.85)"/>
              </div>
            </div>
          )
        }
        <style jsx>{`
          .container {
            width: 100%;
            height: 100%;
            position: relative;
            font-size: 12px;
            color: white;
          }

          .value {
            width: 100%;
            height: 100%;
            background: hsla(0,0%,100%,.1);
            border-radius: 4px;
            padding: 4px 8px;
            text-align: center;
            font-size: 12px;
            -webkit-appearance: none;
            outline: none;
            color: white;
            border: none;
            z-index: 50;
            position: relative;
          }

          .value:hover {
            background: hsla(0,0%,100%,.2);
          }

          .arrow {
            position: absolute;
            width: 24px;
            height: 12px;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
          }

          .popup {
            position: absolute;
            height: 48px;
            padding: 0 32px;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 16px;
            background: rgba(255,255,255,0.85);
            box-shadow: 0 8px 16px 0 rgba(0,0,0,0.40);
            z-index: 50;
            border-radius: 2px;
            -webkit-app-region: no-drag;
            display: flex;
            align-items: center;
          }

          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            z-index: 49;
          }

          .slider {
            width: 144px;
            -webkit-appearance: none;
            outline: none;
            background: transparent;
            z-index: 20;
          }

          .slider::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            border-color: transparent;
            background: #fff;
            border-radius: 4px;
            box-shadow: 0px 0px 1px rgba(0, 0, 0, .4);
          }

          .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0px 1px 2px rgba(0, 0, 0, .4);
            margin-top: -6px;
            z-index: 50;
          }
        `}</style>
      </div>
    );
  }
}

Slider.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func
};

export default Slider;
