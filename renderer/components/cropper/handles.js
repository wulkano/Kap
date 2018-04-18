// Packages
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

// Containers
import {connect, CropperContainer, ActionBarContainer} from '../../containers';

class Handle extends React.Component {
  defaultProps = {
    size: 8,
    top: false,
    bottom: false,
    left: false,
    right: false,
    ratioLocked: false
  }

  render() {
    const {size, top, bottom, right, left, onClick, ratioLocked} = this.props;

    const className = classNames('handle', {
      'handle-top': top,
      'handle-bottom': bottom,
      'handle-right': right,
      'handle-left': left,
      'place-on-top': top + bottom + left + right === 2,
      hide: ratioLocked && top + bottom + left + right === 1
    });

    return (
      <div className={className} onMouseDown={onClick.bind(this, this.props)}>
        <style jsx>{`
          .handle {
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 2px;
            background: white;
            border: 1px solid gray;
            top: calc(50% - ${size / 2}px);
            left: calc(50% - ${size / 2}px);
            z-index: 4;
            ${getResizingCursor(this.props)}
          }

          .handle-top {
            top: -${1 + (size / 2)}px;
          }

          .handle-bottom {
            top: calc(100% - ${size / 2}px);
          }

          .handle-left {
            left: -${1 + (size / 2)}px;
          }

          .handle-right {
            left: calc(100% - ${size / 2}px);
          }

          .place-on-top {
            z-index: 5;
          }

          .hide {
            display: none;
          }
        `}</style>
      </div>
    );
  }
}

Handle.propTypes = {
  size: PropTypes.number,
  top: PropTypes.bool,
  bottom: PropTypes.bool,
  left: PropTypes.bool,
  right: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  ratioLocked: PropTypes.bool
};

/* eslint-disable react/no-array-index-key */

class Handles extends React.Component {
  defaultProps = {
    ratioLocked: false
  }

  render() {
    const {startResizing, showHandles, ratioLocked} = this.props;

    return (
      <div className="content">
        <div className="border">
          {
            showHandles && Array.apply(null, {length: 8}).map(
              (_, i) => (
                <Handle
                  key={`handle-${i}`}
                  border={1}
                  top={i % 3 === 0}
                  bottom={i % 3 === 1}
                  left={Math.floor(i / 3) === 0}
                  right={Math.floor(i / 3) === 1}
                  onClick={startResizing}
                  ratioLocked={ratioLocked}/>
              )
            )
          }
          { this.props.children }
        </div>
        <style jsx>{`
          .border {
            outline: 1px solid white;
            position: relative;
            flex: 1;
            display: flex;
          }

          .border:before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            outline: 1px dashed black;
            z-index: 2;
          }
        `}</style>
      </div>
    );
  }
}

/* eslint-enable react/no-array-index-key */

Handles.propTypes = {
  startResizing: PropTypes.func.isRequired,
  showHandles: PropTypes.func.isRequired,
  ratioLocked: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default connect(
  [CropperContainer, ActionBarContainer],
  ({showHandles}, {ratioLocked}) => ({showHandles, ratioLocked}),
  ({startResizing}) => ({startResizing})
)(Handles);

export const getResizingCursor = ({top, bottom, right, left}) => {
  if ((top || bottom) && !left && !right) {
    return 'cursor: ns-resize;';
  }
  if ((left || right) && !top && !bottom) {
    return 'cursor: ew-resize;';
  }
  if ((top && left) || (bottom && right)) {
    return 'cursor: nwse-resize;';
  }
  if ((top && right) || (bottom && left)) {
    return 'cursor: nesw-resize;';
  }
};
