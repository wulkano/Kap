import React from 'react';
import PropTypes from 'prop-types';

import {connect, EditorContainer} from '../../../containers';
import Select from './select';

class LeftOptions extends React.Component {
  handleClick = fps => () => this.props.setFps(fps);

  render() {
    const {width, height, changeDimension, fps, fpsOptions, setFps, format} = this.props;

    if (!width && !height) {
      return null;
    }

    const options = (
      format === 'gif' || format === 'apng' ? fpsOptions.filter(opt => opt < 60) : fpsOptions
    ).map(opt => ({value: opt, label: opt}));

    return (
      <div className="container">
        <div className="label">Size</div>
        <input type="text" value={width} size="5" maxLength="5" placeholder="Width" name="width" onChange={changeDimension}/>
        <input type="text" value={height} size="5" maxLength="5" placeholder="Height" name="height" onChange={changeDimension}/>
        <div className="label">FPS</div>
        <div className="fps">
          <Select options={options} selected={fps} onChange={setFps}/>
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
            width: 64px;
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
            background: hsla(0,0%,100%,.2);
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
  fpsOptions: PropTypes.arrayOf(PropTypes.number),
  setFps: PropTypes.func,
  format: PropTypes.string
};

export default connect(
  [EditorContainer],
  ({width, height, fps, fpsOptions, format}) => ({width, height, fps, fpsOptions, format}),
  ({changeDimension, setFps}) => ({changeDimension, setFps})
)(LeftOptions);
