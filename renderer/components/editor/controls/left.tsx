import VideoControlsContainer from '../video-controls-container'
import VideoTimeContainer from '../video-time-container';
import {PlayIcon, PauseIcon} from '../../../vectors';
import formatTime from '../../../utils/format-time';

const LeftControls = () => {
  const {isPaused, play, pause} = VideoControlsContainer.useContainer();
  const {currentTime} = VideoTimeContainer.useContainer();

  return (
    <div className="container">
      <div className="play">
        {
          isPaused ?
            <PlayIcon shadow size="26px" fill="#fff" hoverFill="#fff" onClick={play} /> :
            <PauseIcon shadow size="26px" fill="#fff" hoverFill="#fff" onClick={pause} />
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

export default LeftControls;
