import PropTypes from 'prop-types';
import React from 'react';

import {connect, CropperContainer} from '../../containers';
import {CancelIcon} from '../../vectors';

import Handles from './handles';
import Cursor from './cursor';

class Cropper extends React.Component {
  state = {
    isStopping: false
  };

  stopRecording = async event => {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.isStopping) {
      return;
    }

    this.setState({isStopping: true});

    const currentWindow = this.props.remote.getCurrentWindow();
    currentWindow.setIgnoreMouseEvents(true, {forward: true});
    await this.props.remote.require('./aperture').stopRecording();
  };

  enableCloseButton = event => {
    event.stopPropagation();
    this.props.remote.getCurrentWindow().setIgnoreMouseEvents(false);
  };

  restoreClickThrough = () => {
    this.props.remote.getCurrentWindow().setIgnoreMouseEvents(true, {forward: true});
  };

  render() {
    const {startMoving, width, height, isResizing, isRecording, isActive} = this.props;
    const {isStopping} = this.state;

    return (
      <Handles>
        <div
          className="cropper"
          onMouseDown={startMoving}/>
        {
          isRecording && isActive && (
            <button
              type="button"
              className="recording-close-button"
              title="Stop recording and close"
              aria-label="Stop recording and close"
              disabled={isStopping}
              onMouseDown={event => event.stopPropagation()}
              onMouseEnter={this.enableCloseButton}
              onMouseLeave={this.restoreClickThrough}
              onClick={this.stopRecording}
            >
              <CancelIcon size="18px" fill="white" hoverFill="white"/>
            </button>
          )
        }
        { isResizing && <Cursor width={width} height={height}/> }
        <style jsx>{`
          .cropper {
            flex: 1;
            z-index: 6;
          }

          .recording-close-button {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 30px;
            height: 30px;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            background: rgba(20, 20, 20, 0.78);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
            cursor: pointer;
            outline: none;
            z-index: 20;
            transition: background-color 0.15s ease, transform 0.15s ease;
          }

          .recording-close-button:hover,
          .recording-close-button:focus {
            background: #ff3b30;
            transform: scale(1.06);
          }

          .recording-close-button:disabled {
            cursor: wait;
            opacity: 0.65;
          }
        `}</style>
      </Handles>
    );
  }
}

Cropper.propTypes = {
  startMoving: PropTypes.elementType.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  isResizing: PropTypes.bool,
  isRecording: PropTypes.bool,
  isActive: PropTypes.bool,
  remote: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool
  ]).isRequired
};

export default connect(
  [CropperContainer],
  ({width, height, isResizing, isRecording, isActive}) => ({
    width,
    height,
    isResizing,
    isRecording,
    isActive
  }),
  ({startMoving, remote}) => ({startMoving, remote})
)(Cropper);
