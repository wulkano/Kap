import React from 'react';
import PropTypes from 'prop-types';
import css from 'styled-jsx/css';
import {connect, EditorContainer} from '../../../containers';
import KeyboardNumberInput from '../../keyboard-number-input';
import Slider from './slider';

const {className: keyboardInputClass, styles: keyboardInputStyles} = css.resolve`
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  text-align: center;
  font-size: 12px;
  box-sizing: border-box;
  border: none;
  padding: 4px;
  border-bottom-left-radius: 4px;
  border-top-left-radius: 4px;
  width: 48px;
  color: white;
  box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);

  input + input {
    border-bottom-left-radius: 0;
    border-top-left-radius: 0;
    border-bottom-right-radius: 4px;
    border-top-right-radius: 4px;
    margin-left: 1px;
    margin-right: 16px;
  }

  :focus, :hover {
    outline: none;
    background: hsla(0, 0%, 100%, 0.2);
  }
`;

class LeftOptions extends React.Component {
  handleBlur = event => {
    const {changeDimension} = this.props;
    changeDimension(event, {ignoreEmpty: false});
  }

  render() {
    const {width, height, changeDimension, fps, originalFps, setFps, original} = this.props;

    return (
      <div className="container">
        <div className="label">Size</div>
        <KeyboardNumberInput
          className={keyboardInputClass}
          value={width || ''}
          size="5"
          min={1}
          max={original && original.width}
          name="width"
          onChange={changeDimension}
          onKeyDown={changeDimension}
          onBlur={this.handleBlur}
        />
        <KeyboardNumberInput
          className={keyboardInputClass}
          value={height || ''}
          size="5"
          min={1}
          max={original && original.height}
          name="height"
          onChange={changeDimension}
          onKeyDown={changeDimension}
          onBlur={this.handleBlur}
        />
        <div className="label">FPS</div>
        <div className="fps">
          <Slider value={fps} min={1} max={originalFps} onChange={setFps}/>
        </div>
        {keyboardInputStyles}
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
  changeDimension: PropTypes.elementType,
  fps: PropTypes.number,
  setFps: PropTypes.elementType,
  originalFps: PropTypes.number,
  original: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  })
};

export default connect(
  [EditorContainer],
  ({width, height, fps, originalFps, original}) => ({width, height, fps, originalFps, original}),
  ({changeDimension, setFps}) => ({changeDimension, setFps})
)(LeftOptions);
