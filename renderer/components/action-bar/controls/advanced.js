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

const advancedStyles = css`
  .advanced {
    heigth: 50px;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
  }
`;

const AdvancedControls = {};

class Left extends React.Component {
  render() {
    const {toggleAdvanced, toggleRatioLock, ratioLocked, ratio = []} = this.props;

    return (
      <div className="advanced">
        <BackIcon onClick={toggleAdvanced}/>
        <div className="select">
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
  ratio: PropTypes.array
};

AdvancedControls.Left = connect(
  [ActionBarContainer, CropperContainer],
  ({ratioLocked}, {ratio}) => ({ratio, ratioLocked}),
  ({toggleAdvanced, toggleRatioLock}) => ({toggleAdvanced, toggleRatioLock})
)(Left);

class Right extends React.Component {
  render() {
    const {width, height} = this.props;

    return (
      <div className="advanced">
        <div className="dimensions">
          <input type="text" size="5" maxLength="5" value={width}/>
          <input type="text" size="5" maxLength="5" value={height}/>
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
  width: PropTypes.number,
  height: PropTypes.number
};

AdvancedControls.Right = connect(
  [CropperContainer],
  ({width, height}) => ({width, height})
)(Right);

export default AdvancedControls;
