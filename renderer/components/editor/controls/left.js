import PropTypes from 'prop-types';
import React from 'react';

import {PlayIcon, PauseIcon} from '../../../vectors';
import {connect, VideoContainer} from '../../../containers';
import formatTime from '../../../utils/format-time';

class LeftControls extends React.Component {
  render() {
    const {play, pause, isPaused, currentTime} = this.props;

    return (
      <div className="container">
        <div className="play">
          {
            isPaused ?
              <PlayIcon shadow size="26px" fill="#fff" hoverFill="#fff" onClick={play}/> :
              <PauseIcon shadow size="26px" fill="#fff" hoverFill="#fff" onClick={pause}/>
          }
        </div>
        <div className="time">{formatTime(currentTime, {showMilliseconds: false})}</div>
        <style jsx>{`
            .container {
              display: flex;
              color: white;
              width: 100%;
              font-size: 12px;
              align-items: center;
              padding: 0 16px;
            }

            .play {
              width: 26px;
              height: 26px;
              margin-right: 16px;
              display: flex;
              align-items: center;
            }

            .time {
              width: 46px;
              text-shadow: 1px 1px rgba(0, 0, 0, 0.1);
            }
        `}</style>
      </div>
    );
  }
}

LeftControls.propTypes = {
  play: PropTypes.elementType,
  pause: PropTypes.elementType,
  isPaused: PropTypes.bool,
  currentTime: PropTypes.number
};

export default connect(
  [VideoContainer],
  ({isPaused, currentTime}) => ({isPaused, currentTime}),
  ({play, pause}) => ({play, pause})
)(LeftControls);
