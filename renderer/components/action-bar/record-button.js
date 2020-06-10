import electron from 'electron';
import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {connect, CropperContainer} from '../../containers';
import {handleKeyboardActivation} from '../../utils/inputs';

const getMediaNode = deviceId => new Promise((resolve, reject) => {
  navigator.getUserMedia({
    audio: {deviceId}
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

    resolve({javascriptNode, analyser});
  }, reject);
});

const RecordButton = ({
  cropperExists,
  x,
  y,
  width,
  height,
  screenWidth,
  screenHeight,
  displayId,
  willStartRecording,
  recordAudio,
  audioInputDeviceId
}) => {
  const [showFirstRipple, setShowFirstRipple] = useState(false);
  const [showSecondRipple, setShowSecondRipple] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);

  useEffect(() => {
    let node;

    const connectToDevice = async () => {
      try {
        const {javascriptNode, analyser} = await getMediaNode(audioInputDeviceId);

        javascriptNode.onaudioprocess = () => {
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);

          const avg = array.reduce((p, c) => p + c) / array.length;
          if (avg >= 36) {
            setShowFirstRipple(true);
            setShowSecondRipple(true);
            setShouldStop(false);
          } else {
            setShouldStop(true);
          }
        };

        node = javascriptNode;
      } catch (error) {
        console.error('An error occurred when trying to get audio levels:', error);
      }
    };

    if (recordAudio && audioInputDeviceId) {
      connectToDevice();
    }

    return () => {
      if (node && typeof node.disconnect === 'function') {
        node.disconnect();
      }
    };
  }, [recordAudio, audioInputDeviceId]);

  const shouldFirstStop = () => {
    if (shouldStop) {
      setShowFirstRipple(false);
    }
  };

  const shouldSecondStop = () => {
    if (shouldStop) {
      setShowSecondRipple(false);
    }
  };

  const startRecording = event => {
    event.stopPropagation();

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
  };

  return (
    <div
      className={classNames('container', {'cropper-exists': cropperExists})}
      tabIndex={cropperExists ? 0 : -1}
      onKeyDown={handleKeyboardActivation(startRecording)}
    >
      <div className="outer" onMouseDown={startRecording}>
        <div className="inner">
          {!cropperExists && <div className="fill"/>}
        </div>
        {showFirstRipple && <div className="ripple first" onAnimationIteration={shouldFirstStop}/>}
        {showSecondRipple && <div className="ripple second" onAnimationIteration={shouldSecondStop}/>}
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
              background: var(--record-button-background);
              border: 2px solid var(--record-button-border-color);
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
              background: var(--record-button-inner-background${cropperExists ? '-cropper' : ''});
              ${cropperExists ? '' : 'border: var(--record-button-inner-border-width) solid var(--record-button-inner-border);'}
              box-sizing: border-box;
            }

            .fill {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: var(--record-button-fill-background);
              margin: 2px;
            }

            .ripple {
              box-sizing: border-box;
              border-radius: 50%;
              border: 1px solid var(--record-button-ripple-color);
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

            .container.cropper-exists:focus .outer {
              border: 2px solid var(--record-button-focus-outter-border);
              background: var(--record-button-focus-outter-background);
            }

            .container.cropper-exists:focus .inner {
              border-color: var(--record-button-border-color);
              background: var(--record-button-focus-background${cropperExists ? '-cropper' : ''});
            }

            .container.cropper-exists:focus .fill {
              background: var(--record-button-fill-background);
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
};

RecordButton.propTypes = {
  cropperExists: PropTypes.bool,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  screenWidth: PropTypes.number,
  screenHeight: PropTypes.number,
  displayId: PropTypes.number,
  willStartRecording: PropTypes.elementType,
  recordAudio: PropTypes.bool,
  audioInputDeviceId: PropTypes.string
};

export default connect(
  [CropperContainer],
  ({x, y, width, height, screenWidth, screenHeight, displayId, recordAudio, audioInputDeviceId}) => ({x, y, width, height, screenWidth, screenHeight, displayId, recordAudio, audioInputDeviceId}),
  ({willStartRecording}) => ({willStartRecording})
)(RecordButton);
