import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import {VolumeHighIcon, VolumeOffIcon} from '../../../vectors';
import {connect, VideoContainer, EditorContainer} from '../../../containers';

import formatTime from '../../../utils/format-time';

class RightControls extends React.Component {
  state = {}

  componentDidMount() {
    const settings = electron.remote.require('./common/settings');
    const recordAudio = settings.get('recordAudio');
    this.setState({recordAudio});
  }

  render() {
    const {isMuted, mute, unmute, format, duration, hasAudio} = this.props;
    const {recordAudio} = this.state;
    const canUnmute = !['gif', 'apng'].includes(format);
    const unmuteColor = canUnmute && recordAudio ? '#fff' : 'rgba(255, 255, 255, 0.40)';
    return (
      <div className="container">
        <div className="time">{formatTime(duration)}</div>
        <div className="mute">
          {
            isMuted || !recordAudio || !hasAudio ?
              <VolumeOffIcon shadow fill={unmuteColor} hoverFill={unmuteColor} onClick={canUnmute && recordAudio ? unmute : undefined}/> :
              <VolumeHighIcon shadow fill="#fff" hoverFill="#fff" onClick={mute}/>
          }
        </div>
        <style jsx>{`
            .container {
              display: flex;
              width: 100%;
              align-items: center;
              font-size: 12px;
              padding: 0 16px;
              color: white;
              justify-content: flex-end;
            }

            .mute {
              width: 24px;
              height: 24px;
              margin-left: 16px;
            }

            .time {
              text-shadow: 1px 1px rgba(0, 0, 0, 0.1);
              text-align: left;
              width: 46px;
            }
        `}</style>
      </div>
    );
  }
}

RightControls.propTypes = {
  hasAudio: PropTypes.bool,
  isMuted: PropTypes.bool,
  mute: PropTypes.func,
  unmute: PropTypes.func,
  format: PropTypes.string,
  duration: PropTypes.number
};

export default connect(
  [VideoContainer, EditorContainer],
  ({isMuted, duration, hasAudio}, {format}) => ({hasAudio, isMuted, format, duration}),
  ({mute, unmute}) => ({mute, unmute})
)(RightControls);
