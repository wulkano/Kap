import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import {connect, CropperContainer, ActionBarContainer} from '../../containers';

class Handle extends React.Component {
  static defaultProps = {
    size: 8,
    top: false,
    bottom: false,
    left: false,
    right: false,
    ratioLocked: false
  }

  render() {
    const {
      size,
      top,
      bottom,
      right,
      left,
      onClick,
      ratioLocked
    } = this.props;

    const className = classNames('handle', {
      'handle-top': top,
      'handle-bottom': bottom,
      'handle-right': right,
      'handle-left': left,
      'place-on-top': top + bottom + left + right === 2,
      hide: ratioLocked && top + bottom + left + right === 1
    });

    return (
      <div className={className} onMouseDown={() => onClick(this.props)}>
        <style jsx>{`
          .handle {
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: white;
            border: 1px solid gray;
            top: calc(50% - ${size / 2}px);
            left: calc(50% - ${size / 2}px);
            z-index: 8;
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
            z-index: 9;
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

class Handles extends React.Component {
  static defaultProps = {
    ratioLocked: false,
    width: 0,
    height: 0
  }

  render() {
    const {
      startResizing,
      showHandles,
      ratioLocked,
      width,
      height,
      isActive,
      willStartRecording
    } = this.props;

    if (width + height === 0) {
      return null;
    }

    const show = !willStartRecording && isActive && showHandles;

    return (
      <div className="content">
        <div className="border">
          {
            show && [...(new Array(8).keys())].map(
              i => (
                <Handle
                  key={`handle-${i}`}
                  border={1}
                  top={i % 3 === 0}
                  bottom={i % 3 === 1}
                  left={Math.floor(i / 3) === 0}
                  right={Math.floor(i / 3) === 1}
                  ratioLocked={ratioLocked}
                  onClick={startResizing}
                />
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

Handles.propTypes = {
  isActive: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  startResizing: PropTypes.func.isRequired,
  showHandles: PropTypes.bool,
  ratioLocked: PropTypes.bool,
  willStartRecording: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default connect(
  [CropperContainer, ActionBarContainer],
  ({showHandles, width, height, isActive, willStartRecording}, {ratioLocked}) => ({showHandles, width, height, isActive, ratioLocked, willStartRecording}),
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
