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
  }

  render() {
    const {
      startMoving,
      x,
      y,
      width,
      height,
      hidden,
      advanced,
      moving,
      recording,
      cropperWidth,
      cropperHeight
    } = this.props;

    const className = classNames('action-bar', {moving, hidden, advanced, recording});

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
          cropperExists={cropperWidth + cropperHeight !== 0}/>
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
              box-shadow: 0px 0px 5px 2px rgba(0,0,0,0.2);
              z-index: 10;
              top: ${y}px;
              left: ${x}px;
              display: flex;
              align-items: center;
              overflow: hidden;
              opacity: 1;
              transition: all 0.2s ease-out;
              box-sizing: border-box;
            }

            .recording {
              transition-duration: 0.4s;
              transform: scale(0.30);
              opacity: 0.1;
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
  moving: PropTypes.bool,
  recording: PropTypes.bool,
  cropperWidth: PropTypes.number,
  cropperHeight: PropTypes.number
};

export default connect(
  [ActionBarContainer, CropperContainer],
  ({advanced, moving, width, height, x, y}, {recording, picking, resizing, width: cropperWidth, isActive, height: cropperHeight, moving: cropperMoving}) => ({
    advanced, width, height, x, y, moving, hidden: !isActive || cropperMoving || resizing || picking || recording, cropperWidth, cropperHeight
  }),
  ({startMoving}) => ({startMoving})
)(ActionBar);
