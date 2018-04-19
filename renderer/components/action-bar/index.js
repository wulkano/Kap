// Packages
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

// Containers
import {connect, CropperContainer, ActionBarContainer} from '../../containers';

// Components
import MainControls from './controls/main';
import AdvancedControls from './controls/advanced';

class ActionBar extends React.Component {
  render() {
    const {startMoving, x, y, width, height, hidden, advanced, moving, startRecording, recording} = this.props;

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
        <div className="record" onClick={startRecording}/>
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
              padding: 0 15px;
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

            .record {
              border-radius: 50%;
              background: #ff6059;
              width: 32px;
              height: 32px;
              margin: 15px;
            }

            .actions {
              flex: 1;
              display: flex;
              flex-direction: column;
              height: 100px;
              margin-top: 50px;
              transition: margin 0.25s ease-in-out;
            }

            .action-bar.advanced .actions {
              margin-top: -50px;
            }
        `}</style>
      </div>
    );
  }
}

ActionBar.propTypes = {
  startMoving: PropTypes.func.isRequired,
  startRecording: PropTypes.func.isRequired,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  hidden: PropTypes.bool,
  advanced: PropTypes.bool,
  moving: PropTypes.bool,
  recording: PropTypes.bool
};

export default connect(
  [ActionBarContainer, CropperContainer],
  ({advanced, moving, width, height, x, y, recording}, {resizing, moving: cropperMoving}) => ({
    advanced, width, height, x, y, moving, recording, hidden: cropperMoving || resizing
  }),
  ({startMoving, startRecording}) => ({startMoving, startRecording})
)(ActionBar);
