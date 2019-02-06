import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

import {connect, CropperContainer} from '../../containers';
import {handleKeyboardActivation} from '../../utils/inputs';

class RecordButton extends React.Component {
  state = {}

  componentDidMount() {
    const settings = electron.remote.require('./common/settings');
    const recordAudio = settings.get('recordAudio');
    const audioInputDeviceId = settings.get('audioInputDeviceId');

    if (recordAudio) {
      navigator.getUserMedia({
        audio: {
          deviceId: audioInputDeviceId
        }
      }, stream => {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);

        javascriptNode.connect(audioContext.destination);
        javascriptNode.onaudioprocess = () => {
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);

          const avg = array.reduce((p, c) => p + c) / array.length;
          if (avg >= 36) {
            this.setState({showFirst: true, showSecond: true, shouldStop: false});
          } else {
            this.setState({shouldStop: true});
          }
        };
      }, error => {
        console.error('An error occurred when trying to get audio levels:', error);
      });
    }
  }

  shouldFirstStop = () => {
    if (this.state.shouldStop) {
      this.setState({showFirst: false});
    }
  }

  shouldSecondStop = () => {
    if (this.state.shouldStop) {
      this.setState({showSecond: false});
    }
  }

  startRecording = event => {
    event.stopPropagation();
    const {
      cropperExists,
      x,
      y,
      width,
      height,
      screenWidth,
      screenHeight,
      displayId,
      willStartRecording
    } = this.props;

    if (cropperExists) {
      const {remote} = electron;
      const {startRecording} = remote.require('./common/aperture');

      willStartRecording();

      startRecording({
        cropperBounds: {
          x,
          y,
          width,
          height
        },
        screenBounds: {
          width: screenWidth,
          height: screenHeight
        },
        displayId
      });
    }
  }

  render() {
    const {showFirst, showSecond} = this.state;
    const {cropperExists} = this.props;

    return (
      <div
        className="container"
        tabIndex={cropperExists ? 0 : -1}
        onKeyDown={handleKeyboardActivation(this.startRecording)}
      >
        <div className="outer" onMouseDown={this.startRecording}>
          <div className="inner">
            {!cropperExists && <div className="fill"/>}
          </div>
          {showFirst && <div className="ripple first" onAnimationIteration={this.shouldFirstStop}/>}
          {showSecond && <div className="ripple second" onAnimationIteration={this.shouldSecondStop}/>}
        </div>
        <style jsx>{`
            .container {
              width: 64px;
              height: 64px;
              display: flex;
              align-items: center;
              justify-content: center;
              outline: none;
            }

            .outer {
              width: 48px;
              height: 48px;
              padding: 8px;
              border-radius: 50%;
              background: #ff6059 radial-gradient(ellipse 100% 0% at 50% 0%, #ff6159 0%, #ff5f52 50%, #ff3a30 100%);
              border: 2px solid #ff3b30;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              position: relative;
            }

            .inner {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #fff;
              box-sizing: border-box;
            }

            .fill {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #ff6059 radial-gradient(ellipse 100% 0% at 50% 0%, #ff6159 0%, #ff5f52 50%, #ff3a30 100%);
              margin: 2px;
            }

            .ripple {
              box-sizing: border-box;
              border-radius: 50%;
              border: 1px solid #ff5e57;
              background: transparent;
              position: absolute;
              width: 100%;
              height: 100%;
            }

            .first {
              animation: ripple 1.8s linear infinite;
            }

            .second {
              animation: ripple 1.8s linear 0.9s infinite;
            }

            .container:focus .outer {
              background: #fff;
            }

            .container:focus .inner {
              border: 2px solid #ff3b30;
              background: radial-gradient(ellipse 100% 0% at 50% 0%, #ff6159 0%, #ff5f52 50%, #ff3a30 100%);
            }

            .container:focus .fill {
              background: #fff;
            }

            @keyframes ripple {
              0% {
                transform: scale(1);
              }

              100% {
                transform: scale(1.3);
                opacity: 0;
              }
            }
        `}</style>
      </div>
    );
  }
}

RecordButton.propTypes = {
  cropperExists: PropTypes.bool,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  screenWidth: PropTypes.number,
  screenHeight: PropTypes.number,
  displayId: PropTypes.number,
  willStartRecording: PropTypes.func
};

export default connect(
  [CropperContainer],
  ({x, y, width, height, screenWidth, screenHeight, displayId}) => ({x, y, width, height, screenWidth, screenHeight, displayId}),
  ({willStartRecording}) => ({willStartRecording})
)(RecordButton);
