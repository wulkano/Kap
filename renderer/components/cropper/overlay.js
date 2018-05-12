import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {
  connect,
  CursorContainer,
  CropperContainer,
  ActionBarContainer
} from '../../containers';

import {getResizingCursor} from './handles';

class Overlay extends React.Component {
  static defaultProps = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }

  render() {
    const {
      onMouseUp,
      setCursor,
      startPicking,
      x,
      y,
      width,
      height,
      moving,
      resizing,
      currentHandle,
      isActive,
      isReady,
      screenWidth,
      screenHeight
    } = this.props;

    if (!isReady) {
      return null;
    }

    const className = classNames('overlay', {
      picking: !resizing && !moving,
      'no-transition': resizing || moving || !isActive
    });

    return (
      <div
        className="content"
        id="container"
        onMouseMove={setCursor}
        onMouseUp={onMouseUp}
      >
        <div id="top" className={className} onMouseDown={startPicking}/>
        <div id="middle">
          <div id="left" className={className} onMouseDown={startPicking}/>
          <div id="center">
            { this.props.children }
          </div>
          <div id="right" className={className} onMouseDown={startPicking}/>
        </div>
        <div id="bottom" className={className} onMouseDown={startPicking}/>
        <style jsx>{`
          .overlay {
            background-color: rgba(0, 0, 0, 0.5);
            transition: all 0.2s ease-out;
          }

          .overlay.picking {
            cursor: crosshair;
          }

          .overlay.no-transition {
            transition: none;
          }

          #middle {
            display: flex;
            flex: 1;
          }

          #center {
            flex: 1;
            position: relative;
            display: flex;
          }

          #left {
            width: ${x}px;
          }

          #top {
            height: ${y}px;
          }

          #right {
            width: ${screenWidth - width - x}px;
          }

          #bottom {
            height: ${screenHeight - height - y}px;
          }

          #container {
            flex-direction: column;
            ${moving ? 'cursor: move;' : ''}
            ${resizing ? getResizingCursor(currentHandle) : ''}
          }
        `}</style>
      </div>
    );
  }
}

Overlay.propTypes = {
  onMouseUp: PropTypes.func.isRequired,
  setCursor: PropTypes.func.isRequired,
  startPicking: PropTypes.func.isRequired,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  moving: PropTypes.bool,
  resizing: PropTypes.bool,
  currentHandle: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  isActive: PropTypes.bool,
  isReady: PropTypes.bool,
  screenWidth: PropTypes.number,
  screenHeight: PropTypes.number
};

export default connect(
  [CropperContainer, ActionBarContainer, CursorContainer],
  ({x, y, width, height, moving, resizing, currentHandle, screenWidth, screenHeight, isReady, isActive}, actionBar) => ({
    x, y, width, height, resizing, currentHandle, screenWidth, screenHeight, isReady, isActive, moving: moving || actionBar.moving
  }),
  ({stopMoving, stopResizing, stopPicking, startPicking}, actionBar, {setCursor}) => ({
    onMouseUp: () => {
      stopMoving();
      stopResizing();
      stopPicking();
      actionBar.stopMoving();
    },
    setCursor,
    startPicking
  })
)(Overlay);
