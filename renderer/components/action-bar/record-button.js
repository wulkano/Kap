import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

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
      }, err => {
        console.error('The following error occured: ' + err.name);
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

  render() {
    const {showFirst, showSecond} = this.state;
    const {cropperExists} = this.props;

    return (
      <div className="container">
        <div className="outer">
          <div className="inner">
            {!cropperExists && <div className="fill"/>}
          </div>
          { showFirst && <div className="ripple first" onAnimationIteration={this.shouldFirstStop}/>}
          { showSecond && <div className="ripple second" onAnimationIteration={this.shouldSecondStop}/>}
        </div>
        <style jsx>{`
            .container {
              width: 64px;
              height: 64px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .outer {
              width: 48px;
              height: 48px;
              padding: 8px;
              border-radius: 50%;
              background: #ff5e57;
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
              background: #ff5e57;
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

            @keyframes ripple{
              0% {transform:scale(1); }
              100% {transform:scale(1.3); opacity:0;}
            }
        `}</style>
      </div>
    );
  }
}

RecordButton.propTypes = {
  cropperExists: PropTypes.bool
};

export default RecordButton;
