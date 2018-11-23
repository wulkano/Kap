import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {connect, CropperContainer, ActionBarContainer} from '../../containers';

import MainControls from './controls/main';
import AdvancedControls from './controls/advanced';
import RecordButton from './record-button';

class ActionBar extends React.Component {
  static defaultProps = {
    cropperWidth: 0,
    cropperHeight: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0
  };

  render() {
    const {
      startMoving,
      x,
      y,
      width,
      height,
      hidden,
      advanced,
      isMoving,
      cropperWidth,
      cropperHeight
    } = this.props;

    const className = classNames('action-bar', {moving: isMoving, hidden, advanced});

    return (
      <div
        className={className}
        onMouseDown={startMoving}
      >
        <div className="actions">
          <MainControls.Left/>
          <AdvancedControls.Left/>
        </div>
        <RecordButton
          cropperExists={Boolean(cropperWidth && cropperHeight)}/>
        <div className="actions">
          <MainControls.Right/>
          <AdvancedControls.Right/>
        </div>

        <style jsx>{`
            .action-bar {
              position: fixed;
              height: ${height}px;
              width: ${width}px;
              background: white;
              border-radius: 4px;
              box-shadow: 0 20px 40px 0 rgba(0, 0, 0, .2);
              z-index: 10;
              top: ${y}px;
              left: ${x}px;
              display: flex;
              align-items: center;
              overflow: hidden;
              opacity: 1;
              transition: opacity 0.2s ease-out;
              box-sizing: border-box;
            }

            .moving {
              transition: none;
            }

            .hidden {
              opacity: 0;
            }

            .actions {
              flex: 1;
              display: flex;
              flex-direction: column;
              height: 128px;
              width: 200px;
              margin-top: 64px;
              transition: margin 0.25s ease-in-out;
            }

            .action-bar.advanced .actions {
              margin-top: -64px;
            }
        `}</style>
      </div>
    );
  }
}

ActionBar.propTypes = {
  startMoving: PropTypes.func.isRequired,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  hidden: PropTypes.bool,
  advanced: PropTypes.bool,
  isMoving: PropTypes.bool,
  isRecording: PropTypes.bool,
  cropperWidth: PropTypes.number,
  cropperHeight: PropTypes.number
};

export default connect(
  [ActionBarContainer, CropperContainer],
  ({advanced, isMoving, width, height, x, y}, {willStartRecording, isPicking, isResizing, width: cropperWidth, isActive, height: cropperHeight, isMoving: cropperMoving}) => ({
    advanced, width, height, x, y, isMoving, hidden: !isActive || cropperMoving || isResizing || isPicking || willStartRecording, cropperWidth, cropperHeight
  }),
  ({startMoving}) => ({startMoving})
)(ActionBar);
