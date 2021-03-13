import {TooltipIcon} from '../../../vectors';
import {useState, useEffect} from 'react';
import {shake} from '../../../utils/inputs';

interface Props {
  value: number;
  onChange: (newValue: number) => void;
  min: number;
  max: number;
}

const Slider = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [valueText, setValueText] = useState(props.value?.toString());

  useEffect(() => {
    setValueText(props.value?.toString());
  }, [props.value]);

  const onChange = event => {
    setValueText(event.currentTarget.value);
  };

  const onBlur = event => {
    const {currentTarget} = event;
    const value = Number.parseInt(currentTarget.value, 10);

    if (value && value >= props.min && value <= props.max) {
      props.onChange(value);
      setValueText(value.toString());
    } else if (value) {
      const newValue = Math.min(Math.max(value, props.min), props.max);
      props.onChange(newValue);
      setValueText(newValue.toString());
      shake(currentTarget);
    } else {
      setValueText(props.value.toString());
      shake(currentTarget);
    }
  };

  const onKeyDown = event => {
    if (event.key === 'Enter') {
      onBlur(event);
    }
  };

  const onSliderChange = event => {
    const value = Number.parseInt(event.currentTarget.value, 10);
    props.onChange(value);
    setValueText(value.toString());
  };

  return (
    <div className="container">
      {isOpen && <div
        className="overlay" onClick={() => {
          setIsOpen(false);
        }}/>}
      <input
        type="text"
        className="value"
        value={valueText || ''}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onFocus={() => {
          setIsOpen(true);
        }}
      />
      {
        isOpen && (
          <div
            className="popup" onClick={event => {
              event.stopPropagation();
            }}
          >
            <input
              type="range"
              className="slider"
              min={props.min}
              max={props.max}
              step={1}
              value={props.value || props.min}
              onChange={onSliderChange}
              onBlur={() => {
                setIsOpen(false);
              }}
            />
            <div className="arrow">
              <TooltipIcon fill="var(--slider-popup-background)" hoverFill="var(--slider-popup-background)"/>
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
            background: rgba(255, 255, 255, 0.1);
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
            box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
          }

          .value:hover,
          .value:focus {
            background: hsla(0, 0%, 100%, 0.2);
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
            background: var(--slider-popup-background);
            box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.40);
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
            background: var(--slider-background-color);
            border-radius: 4px;
            box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.4);
          }

          .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: var(--slider-thumb-color);
            box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.4);
            margin-top: -6px;
            z-index: 50;
          }

          .slider:focus::-webkit-slider-thumb {
            border: 1px solid var(--kap);
          }
        `}</style>
    </div>
  );
};

export default Slider;

// Import React from 'react';
// import PropTypes from 'prop-types';

// class Slider extends React.Component {
//   state = {
//     isOpen: false
//   }

//   show = () => this.setState({isOpen: true})

//   hide = () => this.setState({isOpen: false})

//   handleChange = event => {
//     const {onChange} = this.props;
//     onChange(event.target.value, event.target);
//   }

//   handleBlur = event => {
//     const {onChange} = this.props;
//     onChange(event.target.value, event.target, {ignoreEmpty: false});
//   }

//   render() {
//     const {value, max, min} = this.props;
//     const {isOpen} = this.state;

// return (
//   <div className="container">
//     { isOpen && <div className="overlay" onClick={this.hide}/> }
//     <input type="text" className="value" value={value || ''} onChange={this.handleChange} onBlur={this.handleBlur} onFocus={this.show}/>
//     {
//       isOpen && (
//         <div className="popup" onClick={event => event.stopPropagation()}>
//           <input type="range" className="slider" min={min} max={max} step={1} value={value || min} onChange={this.handleChange}/>
//           <div className="arrow">
//             <TooltipIcon fill="var(--slider-popup-background)" hoverFill="var(--slider-popup-background)"/>
//           </div>
//         </div>
//       )
//     }
//     <style jsx>{`
//       .container {
//         width: 100%;
//         height: 100%;
//         position: relative;
//         font-size: 12px;
//         color: white;
//       }

//       .value {
//         width: 100%;
//         height: 100%;
//         background: rgba(255, 255, 255, 0.1);
//         border-radius: 4px;
//         padding: 4px 8px;
//         text-align: center;
//         font-size: 12px;
//         -webkit-appearance: none;
//         outline: none;
//         color: white;
//         border: none;
//         z-index: 50;
//         position: relative;
//         box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
//       }

//       .value:hover,
//       .value:focus {
//         background: hsla(0, 0%, 100%, 0.2);
//       }

//       .arrow {
//         position: absolute;
//         width: 24px;
//         height: 12px;
//         top: 100%;
//         left: 50%;
//         transform: translateX(-50%);
//       }

//       .popup {
//         position: absolute;
//         height: 48px;
//         padding: 0 32px;
//         bottom: 100%;
//         left: 50%;
//         transform: translateX(-50%);
//         margin-bottom: 16px;
//         background: var(--slider-popup-background);
//         box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.40);
//         z-index: 50;
//         border-radius: 2px;
//         -webkit-app-region: no-drag;
//         display: flex;
//         align-items: center;
//       }

//       .overlay {
//         position: fixed;
//         top: 0;
//         left: 0;
//         width: 100%;
//         height: 100%;
//         background: transparent;
//         z-index: 49;
//       }

//       .slider {
//         width: 144px;
//         -webkit-appearance: none;
//         outline: none;
//         background: transparent;
//         z-index: 20;
//       }

//       .slider::-webkit-slider-runnable-track {
//         width: 100%;
//         height: 4px;
//         border-color: transparent;
//         background: var(--slider-background-color);
//         border-radius: 4px;
//         box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.4);
//       }

//       .slider::-webkit-slider-thumb {
//         -webkit-appearance: none;
//         height: 16px;
//         width: 16px;
//         border-radius: 50%;
//         background: var(--slider-thumb-color);
//         box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.4);
//         margin-top: -6px;
//         z-index: 50;
//       }

//       .slider:focus::-webkit-slider-thumb {
//         border: 1px solid var(--kap);
//       }
//     `}</style>
//   </div>
// );
//   }
// }

// Slider.propTypes = {
//   value: PropTypes.number,
//   max: PropTypes.number,
//   min: PropTypes.number,
//   onChange: PropTypes.elementType
// };

// export default Slider;
