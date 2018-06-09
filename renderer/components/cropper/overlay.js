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
    height: 0,
    isReady: false
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
      screenHeight,
      recording
    } = this.props;

    const contentClassName = classNames('content', {'not-ready': !isReady});

    const className = classNames('overlay', {
      recording,
      picking: !recording && !resizing && !moving,
      'no-transition': resizing || moving || !isActive
    });

    return (
      <div
        className={contentClassName}
        id="container"
        onMouseMove={setCursor}
        onMouseUp={onMouseUp}
      >
        <div id="top" className={className} onMouseDown={startPicking}/>
        <div id="middle">
          <div id="left" className={className} onMouseDown={startPicking}/>
          <div id="center">
            { isReady && this.props.children }
          </div>
          <div id="right" className={className} onMouseDown={startPicking}/>
        </div>
        <div id="bottom" className={className} onMouseDown={startPicking}/>
        <style jsx>{`
          .overlay {
            background-color: rgba(0, 0, 0, .5);
            transition: background-color .5s ease-in-out, width .2s ease-out, height .2s ease-out;
          }

          .overlay.recording {
            background-color: rgba(0, 0, 0, .1);
          }

          .overlay.picking {
            cursor: crosshair;
          }

          .overlay.no-transition {
            transition: background-color .5s ease-in-out;
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

          .not-ready .overlay {
            background-color: rgba(0, 0, 0, 0);
          }

          .not-ready #left,
          .not-ready #right {
            width: 50%;
          }

          .not-ready #top,
          .not-ready #bottom {
            height: 50%;
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
  screenHeight: PropTypes.number,
  recording: PropTypes.bool
};

export default connect(
  [CropperContainer, ActionBarContainer, CursorContainer],
  ({x, y, width, height, moving, resizing, currentHandle, screenWidth, screenHeight, isReady, isActive, recording}, actionBar) => ({
    x, y, width, height, resizing, currentHandle, screenWidth, screenHeight, isReady, isActive, recording, moving: moving || actionBar.moving
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
