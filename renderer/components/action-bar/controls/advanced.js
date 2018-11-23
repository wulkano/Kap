import PropTypes from 'prop-types';
import React from 'react';
import css from 'styled-jsx/css';

import {
  SwapIcon,
  BackIcon,
  LinkIcon,
  DropdownArrowIcon
} from '../../../vectors';

import {connect, ActionBarContainer, CropperContainer} from '../../../containers';

import {
  handleWidthInput,
  handleHeightInput,
  buildAspectRatioMenu,
  handleInputKeyPress,
  RATIOS
} from '../../../utils/inputs';

const advancedStyles = css`
  .advanced {
    height: 64px;
    display: flex;
    flex: 1;
    align-items: center;
    padding: 0 8px;
  }
`;

const AdvancedControls = {};

const stopPropagation = event => event.stopPropagation();

class Left extends React.Component {
  state = {}

  select = React.createRef();

  static getDerivedStateFromProps(nextProps, prevState) {
    const {ratio, isResizing, setRatio} = nextProps;

    if (ratio !== prevState.ratio && !isResizing) {
      return {
        ratio,
        menu: buildAspectRatioMenu({setRatio, ratio})
      };
    }

    return null;
  }

  openMenu = () => {
    const {ratio} = this.props;
    const boundingRect = this.select.current.getBoundingClientRect();
    const {top, left} = boundingRect;
    const selectedRatio = ratio.join(':');
    const index = RATIOS.findIndex(r => r === selectedRatio);
    const positioningItem = index > -1 ? index : RATIOS.length;

    this.state.menu.popup({
      x: Math.round(left),
      y: Math.round(top) + 6,
      positioningItem
    });
  }

  render() {
    const {toggleAdvanced, toggleRatioLock, ratioLocked, ratio = []} = this.props;

    return (
      <div className="advanced">
        <div className="back">
          <BackIcon onClick={toggleAdvanced}/>
        </div>
        <div ref={this.select} className="select" onClick={this.openMenu} onMouseDown={stopPropagation}>
          <span>{ratio[0]}:{ratio[1]}</span>
          <DropdownArrowIcon size="18px"/>
        </div>
        <div className="link">
          <LinkIcon active={ratioLocked} onClick={() => toggleRatioLock()}/>
        </div>
        <style jsx>{advancedStyles}</style>
        <style jsx>{`
          .back {
            padding: 0 8px;
          }

          .select {
            border: 1px solid #dbdbdb;
            border-radius: 4px;
            font-size: 0.7rem;
            width: 96px;
            margin: 0 8px;
            transition: border 0.12s ease-in-out;
            display: flex;
            align-items: center;
            padding: 8px;
            height: 32px;
            box-sizing: border-box;
          }

          .select span {
            width: 64px;
            line-height: 16px;
            font-size: 12px;
          }

          .select:hover {
            border-color: #ccc;
          }

          .link {
            width: 32px;
            height: 32px;
            padding: 3px 3px;
            box-sizing: border-box;
            background: ${ratioLocked ? '#f7f7f7' : 'transparent'};
            border: 1px solid #dbdbdb;
            border-radius: 4px;
          }
        `}</style>
      </div>
    );
  }
}

Left.propTypes = {
  toggleAdvanced: PropTypes.func.isRequired,
  toggleRatioLock: PropTypes.func.isRequired,
  ratioLocked: PropTypes.bool,
  isResizing: PropTypes.bool,
  ratio: PropTypes.array
};

AdvancedControls.Left = connect(
  [ActionBarContainer, CropperContainer],
  ({ratioLocked}, {ratio, isResizing}) => ({ratio, ratioLocked, isResizing}),
  ({toggleAdvanced, toggleRatioLock}, {setRatio}) => ({toggleAdvanced, toggleRatioLock, setRatio})
)(Left);

class Right extends React.Component {
  constructor(props) {
    super(props);

    this.widthInput = React.createRef();
    this.heightInput = React.createRef();
  }

  onWidthChange = (event, {ignoreEmpty} = {}) => {
    const {bounds, height, setBounds, ratioLocked, ratio, setWidth} = this.props;
    const {value} = event.currentTarget;
    const {heightInput, widthInput} = this;

    setWidth(value);
    handleWidthInput({
      bounds,
      height,
      setBounds,
      ratioLocked,
      ratio,
      value,
      widthInput,
      heightInput,
      ignoreEmpty
    });
  }

  onHeightChange = (event, {ignoreEmpty} = {}) => {
    const {bounds, width, setBounds, ratioLocked, ratio, setHeight} = this.props;
    const {value} = event.currentTarget;
    const {heightInput, widthInput} = this;

    setHeight(value);
    handleHeightInput({
      bounds,
      width,
      setBounds,
      ratioLocked,
      ratio,
      value,
      widthInput,
      heightInput,
      ignoreEmpty
    });
  }

  onWidthBlur = event => {
    this.onWidthChange(event, {ignoreEmpty: false});
    handleWidthInput.flush();
  }

  onHeightBlur = event => {
    this.onHeightChange(event, {ignoreEmpty: false});
    handleHeightInput.flush();
  }

  render() {
    const {swapDimensions, width, height} = this.props;

    return (
      <div className="advanced">
        <input
          ref={this.widthInput}
          type="text"
          name="width"
          size="5"
          maxLength="5"
          value={width}
          tabIndex={this.props.advanced ? 1 : -1}
          onChange={this.onWidthChange}
          onBlur={this.onWidthBlur}
          onKeyDown={handleInputKeyPress(this.onWidthChange)}
          onMouseDown={stopPropagation}
        />
        <div className="swap">
          <SwapIcon onClick={swapDimensions}/>
        </div>
        <input
          ref={this.heightInput}
          type="text"
          name="height"
          size="5"
          maxLength="5"
          value={height}
          tabIndex={this.props.advanced ? 2 : -1}
          onChange={this.onHeightChange}
          onBlur={this.onHeightBlur}
          onKeyDown={handleInputKeyPress(this.onHeightChange)}
          onMouseDown={stopPropagation}
        />
        <style jsx>{advancedStyles}</style>
        <style jsx>{`
          input {
            height: 32px;
            border: 1px solid #ddd;
            background: white;
            text-align: left;
            font-size: 12px;
            transition: border 0.12s ease-in-out;
            box-sizing: border-box;
            padding: 8px;
            border-radius: 4px;
            margin-right: 8px;
            width: 64px;
          }

          input:focus {
            outline: none;
            border: 1px solid #007aff;
          }

          .swap {
            width: 32px;
            height: 32px;
            padding: 3px 3px;
            box-sizing: border-box;
            border: 1px solid #dbdbdb;
            border-radius: 4px;
            margin-right: 8px;
          }
        `}</style>
      </div>
    );
  }
}

Right.propTypes = {
  bounds: PropTypes.object,
  width: PropTypes.string,
  height: PropTypes.string,
  ratio: PropTypes.array,
  ratioLocked: PropTypes.bool,
  advanced: PropTypes.bool,
  setBounds: PropTypes.func.isRequired,
  swapDimensions: PropTypes.func.isRequired,
  setWidth: PropTypes.func.isRequired,
  setHeight: PropTypes.func.isRequired
};

AdvancedControls.Right = connect(
  [CropperContainer, ActionBarContainer],
  (
    {x, y, ratio, width, height},
    {cropperWidth, cropperHeight, ratioLocked, advanced}
  ) => ({
    bounds: {x, y, width, height},
    width: cropperWidth,
    height: cropperHeight,
    ratio,
    ratioLocked,
    advanced
  }),
  (
    {setBounds, swapDimensions},
    {setWidth, setHeight}
  ) => ({
    setBounds,
    swapDimensions,
    setWidth,
    setHeight
  })
)(Right);

export default AdvancedControls;
