import PropTypes from 'prop-types';
import React from 'react';

import {PlayIcon, PauseIcon} from '../../../vectors';
import {connect, VideoContainer} from '../../../containers';
import formatTime from '../../../utils/format-time';

class LeftControls extends React.Component {
  render() {
    const {play, pause, paused, currentTime} = this.props;

    return (
      <div className="container">
        <div className="play">
          {
            paused ?
              <PlayIcon fill="#fff" hoverFill="#fff" onClick={play}/> :
              <PauseIcon fill="#fff" hoverFill="#fff" onClick={pause}/>
          }
        </div>
        <div className="time">{formatTime(currentTime)}</div>
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
              width: 24px;
              height: 24px;
              margin-right: 16px;
            }
        `}</style>
      </div>
    );
  }
}

LeftControls.propTypes = {
  play: PropTypes.func,
  pause: PropTypes.func,
  paused: PropTypes.bool,
  currentTime: PropTypes.number
};

export default connect(
  [VideoContainer],
  ({paused, currentTime}) => ({paused, currentTime}),
  ({play, pause}) => ({play, pause})
)(LeftControls);
