import React from 'react';
import PropTypes from 'prop-types';

import {connect, EditorContainer} from '../../../containers';
import Slider from './slider';

class LeftOptions extends React.Component {
  render() {
    const {width, height, changeDimension, fps, originalFps, setFps} = this.props;

    if (!width && !height) {
      return null;
    }

    return (
      <div className="container">
        <div className="label">Size</div>
        <input type="text" value={width} size="5" maxLength="5" placeholder="Width" name="width" onChange={changeDimension}/>
        <input type="text" value={height} size="5" maxLength="5" placeholder="Height" name="height" onChange={changeDimension}/>
        <div className="label">FPS</div>
        <div className="fps">
          <Slider value={fps} min={1} max={originalFps} onChange={setFps}/>
        </div>
        <style jsx>{`
          .container {
            height: 100%;
            display: flex;
            align-items: center;
          }

          .label {
            font-size: 12px;
            margin-right: 8px;
            color: white;
          }

          .fps {
            height: 24px;
            width: 32px;
          }

          input {
            height: 24px;
            background: hsla(0,0%,100%,.1);
            text-align: center;
            font-size: 12px;
            box-sizing: border-box;
            border: none;
            padding: 4px;
            border-bottom-left-radius: 4px;
            border-top-left-radius: 4px;
            width: 48px;
            color: white;
          }

          input + input {
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
            border-bottom-right-radius: 4px;
            border-top-right-radius: 4px;
            margin-left: 1px;
            margin-right: 16px;
          }

          input:focus, input:hover {
            outline: none;
            background: hsla(0,0%,100%,.2);
          }

          .option {
            width: 48px;
            height: 22px;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            box-sizing: border-box;
          }

          .option:hover {
            background: hsla(0, 0%, 100%, 0.2);
          }

          .option:active,
          .option.selected {
            background: transparent;
          }
        `}</style>
      </div>
    );
  }
}

LeftOptions.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  changeDimension: PropTypes.func,
  fps: PropTypes.number,
  setFps: PropTypes.func,
  originalFps: PropTypes.number
};

export default connect(
  [EditorContainer],
  ({width, height, fps, originalFps}) => ({width, height, fps, originalFps}),
  ({changeDimension, setFps}) => ({changeDimension, setFps})
)(LeftOptions);
