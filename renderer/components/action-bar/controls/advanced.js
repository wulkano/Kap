// Packages
import PropTypes from 'prop-types';
import React from 'react';
import css from 'styled-jsx/css';

// Vectors
import {
  SwapIcon,
  BackIcon,
  LinkIcon,
  DropdownArrowIcon
} from '../../../vectors';

// Containers
import {connect, ActionBarContainer, CropperContainer} from '../../../containers';

// Utilities
import {
  handleWidthInput,
  handleHeightInput,
  buildAspectRatioMenu,
  handleInputKeyPress
} from '../../../utils/inputs';

const advancedStyles = css`
  .advanced {
    height: 50px;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
  }
`;

const AdvancedControls = {};

class Left extends React.Component {
  componentDidMount() {
    this.buildMenu(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.ratio !== this.props.ratio && !nextProps.resizing) {
      this.buildMenu(nextProps);
    }
  }

  buildMenu = props => {
    const {setRatio, ratio} = props;
    this.menu = buildAspectRatioMenu({setRatio, ratio});
  }

  render() {
    const {toggleAdvanced, toggleRatioLock, ratioLocked, ratio = []} = this.props;

    return (
      <div className="advanced">
        <BackIcon onClick={toggleAdvanced}/>
        <div className="select" onClick={() => this.menu.popup()}>
          <span>{ratio[0]}:{ratio[1]}</span>
          <DropdownArrowIcon size={15}/>
        </div>
        <LinkIcon active={ratioLocked} onClick={() => toggleRatioLock()}/>
        <style jsx>{advancedStyles}</style>
        <style jsx>{`
          .select {
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.7rem;
            height: 1.1rem;
            transition: border 0.12s ease-in-out;
            display: flex;
            align-items: center;
            padding: 0 5px;
          }

          .select span {
            flex: 1;
            text-align: right;
            padding-right: 5px;
          }

          .select:hover {
            border-color: #ccc;
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
  resizing: PropTypes.bool,
  ratio: PropTypes.array
};

AdvancedControls.Left = connect(
  [ActionBarContainer, CropperContainer],
  ({ratioLocked}, {ratio, resizing}) => ({ratio, ratioLocked, resizing}),
  ({toggleAdvanced, toggleRatioLock}, {setRatio}) => ({toggleAdvanced, toggleRatioLock, setRatio})
)(Left);

class Right extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: props.width,
      height: props.height
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      width: newProps.width,
      height: newProps.height
    });
  }

  onWidthChange = e => {
    const {x, y, setBounds, ratioLocked, ratio} = this.props;
    const {value} = e.target;
    const {heightInput, widthInput} = this;

    this.setState({width: value});
    handleWidthInput({x, y, setBounds, ratioLocked, ratio, value, widthInput, heightInput});
  }

  onHeightChange = e => {
    const {x, y, setBounds, ratioLocked, ratio} = this.props;
    const {value} = e.target;
    const {heightInput, widthInput} = this;

    this.setState({height: value});
    handleHeightInput({x, y, setBounds, ratioLocked, ratio, value, widthInput, heightInput});
  }

  render() {
    const {width, height} = this.state;

    return (
      <div className="advanced">
        <div className="dimensions">
          <input
            ref={
              c => {
                this.widthInput = c;
              }
            }
            type="text"
            size="5"
            maxLength="5"
            value={width}
            onChange={this.onWidthChange}
            onBlur={handleWidthInput.flush}
            onKeyDown={handleInputKeyPress(this.onWidthChange)}/>
          <input
            ref={
              c => {
                this.heightInput = c;
              }
            }
            type="text"
            size="5"
            maxLength="5"
            value={height}
            onChange={this.onHeightChange}
            onBlur={handleHeightInput.flush}
            onKeyDown={handleInputKeyPress(this.onHeightChange)}/>
        </div>
        <SwapIcon/>
        <style jsx>{advancedStyles}</style>
        <style jsx>{`
          .dimensions {
            display: flex;
          }

          input {
            height: 1rem;
            border: 1px solid #ddd;
            background: white;
            text-align: center;
            font-size: 0.7rem;
            transition: border 0.12s ease-in-out;
          }

          input:hover:not(:focus) {
            border-color: #ccc;
          }

          input:first-child {
            border-radius: 4px 0 0 4px;
          }

          input:last-child {
            border-radius: 0 4px 4px 0;
          }

          input:focus {
            outline: none;
            border: 1px solid #007aff;
          }
        `}</style>
      </div>
    );
  }
}

Right.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  ratio: PropTypes.array,
  ratioLocked: PropTypes.bool,
  setBounds: PropTypes.func.isRequired
};

AdvancedControls.Right = connect(
  [CropperContainer, ActionBarContainer],
  ({x, y, width, height, ratio}, {ratioLocked}) => ({x, y, width, height, ratio, ratioLocked}),
  ({setBounds}) => ({setBounds})
)(Right);

export default AdvancedControls;
