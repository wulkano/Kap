import css from 'styled-jsx/css';
import KeyboardNumberInput from '../../keyboard-number-input';
import Slider from './slider';
import OptionsContainer from '../options-container';
import {useState, useEffect, useMemo} from 'react';
import * as stringMath from 'string-math';
import VideoMetadataContainer from '../video-metadata-container';
import {shake} from '../../../utils/inputs';
import Select, {Separator} from './select';

const percentValues = [100, 75, 50, 33, 25, 20, 10];

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

const LeftOptions = () => {
  const {width, height, setDimensions, fps, updateFps, originalFps} = OptionsContainer.useContainer();
  const metadata = VideoMetadataContainer.useContainer();

  const [widthValue, setWidthValue] = useState<string>();
  const [heightValue, setHeightValue] = useState<string>();

  const onChange = (event, {ignoreEmpty = true}: {ignoreEmpty?: boolean} = {}) => {
    if (!ignoreEmpty) {
      onBlur(event);
      return;
    }

    const {currentTarget: {name, value}} = event;
    if (name === 'width') {
      setWidthValue(value);
    } else {
      setHeightValue(value);
    }
  };

  const onBlur = event => {
    const {currentTarget} = event;
    const {name} = currentTarget;

    let value: number;
    try {
      value = stringMath(currentTarget.value);
    } catch {}

    // Fallback to last valid
    const updates = {width, height};

    if (value) {
      value = Math.round(value);
      const ratio = metadata.width / metadata.height;

      if (name === 'width') {
        const min = Math.max(1, Math.ceil(ratio));

        if (value < min) {
          shake(currentTarget, {className: 'shake-left'});
          updates.width = min;
        } else if (value > metadata.width) {
          shake(currentTarget, {className: 'shake-left'});
          updates.width = metadata.width;
        } else {
          updates.width = value;
        }

        updates.height = Math[ratio > 1 ? 'ceil' : 'floor'](updates.width / ratio);
      } else {
        const min = Math.max(1, Math.ceil(1 / ratio));

        if (value < min) {
          shake(currentTarget, {className: 'shake-right'});
          updates.height = min;
        } else if (value > metadata.height) {
          shake(currentTarget, {className: 'shake-right'});
          updates.height = metadata.height;
        } else {
          updates.height = value;
        }

        updates.width = Math[ratio > 1 ? 'floor' : 'ceil'](updates.height * ratio);
      }
    } else if (name === 'width') {
      shake(currentTarget, {className: 'shake-left'});
    } else {
      shake(currentTarget, {className: 'shake-right'});
    }

    setDimensions(updates);
    setWidthValue(updates.width.toString());
    setHeightValue(updates.height.toString());
  };

  useEffect(() => {
    if (width && height) {
      setWidthValue(width.toString());
      setHeightValue(height.toString());
    }
  }, [width, height]);

  const percentOptions = useMemo(() => {
    const ratio = metadata.width / metadata.height;

    const options = percentValues.map(percent => {
      const adjustedWidth = Math.round(metadata.width * (percent / 100));
      const adjustedHeight = Math[ratio > 1 ? 'ceil' : 'floor'](adjustedWidth / ratio);

      return {
        label: `${adjustedWidth} x ${adjustedHeight} (${percent === 100 ? 'Original' : `${percent}%`})`,
        value: {width: adjustedWidth, height: adjustedHeight},
        checked: width === adjustedWidth
      };
    });

    if (options.every(opt => !opt.checked)) {
      return [
        {
          label: 'Custom',
          value: {width, height},
          checked: true
        },
        {
          separator: true
        },
        ...options
      ];
    }

    return options;
  }, [metadata, width, height]);

  const selectPercentage = updates => {
    setDimensions(updates);
    setWidthValue(updates.width.toString());
    setHeightValue(updates.height.toString());
  };

  const percentLabel = `${Math.round((width / metadata.width) * 100)}%`;

  return (
    <div className="container">
      <div className="label">Size</div>
      <KeyboardNumberInput
        className={keyboardInputClass}
        value={widthValue || ''}
        size="5"
        name="width"
        min={1}
        max={metadata.width}
        onChange={onChange}
        onBlur={onBlur}
      />
      <KeyboardNumberInput
        className={keyboardInputClass}
        value={heightValue || ''}
        size="5"
        name="height"
        min={1}
        max={metadata.height}
        onChange={onChange}
        onBlur={onBlur}
      />
      <div className="percent">
        <Select options={percentOptions} customLabel={percentLabel} onChange={selectPercentage}/>
      </div>
      <div className="label">FPS</div>
      <div className="fps">
        <Slider value={fps} min={5} max={originalFps} onChange={updateFps}/>
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

          .percent {
            height: 24px;
            width: 68px;
            margin-left: -8px;
            margin-right: 8px;
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
};

export default LeftOptions;

// Import React from 'react';
// import PropTypes from 'prop-types';
// import {connect, EditorContainer} from '../../../containers';
// import css from 'styled-jsx/css';

// import KeyboardNumberInput from '../../keyboard-number-input';
// import Slider from './slider';

// const {className: keyboardInputClass, styles: keyboardInputStyles} = css.resolve`
//   height: 24px;
//   background: rgba(255, 255, 255, 0.1);
//   text-align: center;
//   font-size: 12px;
//   box-sizing: border-box;
//   border: none;
//   padding: 4px;
//   border-bottom-left-radius: 4px;
//   border-top-left-radius: 4px;
//   width: 48px;
//   color: white;
//   box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);

//   input + input {
//     border-bottom-left-radius: 0;
//     border-top-left-radius: 0;
//     border-bottom-right-radius: 4px;
//     border-top-right-radius: 4px;
//     margin-left: 1px;
//     margin-right: 16px;
//   }

//   :focus, :hover {
//     outline: none;
//     background: hsla(0, 0%, 100%, 0.2);
//   }
// `;

// class LeftOptions extends React.Component {
//   handleBlur = event => {
//     const {changeDimension} = this.props;
//     changeDimension(event, {ignoreEmpty: false});
//   }

//   render() {
// const {width, height, changeDimension, fps, originalFps, setFps, original} = this.props;

// return (
//   <div className="container">
//     <div className="label">Size</div>
//     <KeyboardNumberInput
//       className={keyboardInputClass}
//       value={width || ''}
//       size="5"
//       min={1}
//       max={original && original.width}
//       name="width"
//       onChange={changeDimension}
//       onKeyDown={changeDimension}
//       onBlur={this.handleBlur}
//     />
//     <KeyboardNumberInput
//       className={keyboardInputClass}
//       value={height || ''}
//       size="5"
//       min={1}
//       max={original && original.height}
//       name="height"
//       onChange={changeDimension}
//       onKeyDown={changeDimension}
//       onBlur={this.handleBlur}
//     />
//     <div className="label">FPS</div>
//     <div className="fps">
//       <Slider value={fps} min={1} max={originalFps} onChange={setFps}/>
//     </div>
//     {keyboardInputStyles}
//     <style jsx>{`
//       .container {
//         height: 100%;
//         display: flex;
//         align-items: center;
//       }

//       .label {
//         font-size: 12px;
//         margin-right: 8px;
//         color: white;
//       }

//       .fps {
//         height: 24px;
//         width: 32px;
//       }

//       .option {
//         width: 48px;
//         height: 22px;
//         background: transparent;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         font-size: 12px;
//         color: white;
//         box-sizing: border-box;
//       }

//       .option:hover {
//         background: hsla(0, 0%, 100%, 0.2);
//       }

//       .option:active,
//       .option.selected {
//         background: transparent;
//       }
//     `}</style>
//   </div>
// );
//   }
// }

// LeftOptions.propTypes = {
//   width: PropTypes.number,
//   height: PropTypes.number,
//   changeDimension: PropTypes.elementType,
//   fps: PropTypes.number,
//   setFps: PropTypes.elementType,
//   originalFps: PropTypes.number,
//   original: PropTypes.shape({
//     width: PropTypes.number,
//     height: PropTypes.number
//   })
// };

// export default connect(
//   [EditorContainer],
//   ({width, height, fps, originalFps, original}) => ({width, height, fps, originalFps, original}),
//   ({changeDimension, setFps}) => ({changeDimension, setFps})
// )(LeftOptions);
