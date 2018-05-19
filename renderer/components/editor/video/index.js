import React from 'react';
import PropTypes from 'prop-types';

import PlayPauseButton from '../buttons/play-pause';
import FullscreenButton from '../buttons/fullscreen';
import AudioButton from '../buttons/audio';

import formatTime from '../../../utils/format-time';

const CurrentTime = ({currentTime}) => (
  <div className="current-time">
    {formatTime(currentTime)}
    <style jsx>{`
    .current-time {
      font-size: 12px;
      line-height: 18px;
      margin-top: -2px;
      margin-left: 16px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.10);
      font-weight: 100;
    }
  `}</style>
  </div>
);
CurrentTime.propTypes = {
  currentTime: PropTypes.number.isRequired
};

const getTimestampAtEvent = (event, duration) => {
  const rect = event.target.getBoundingClientRect();
  const xPositionInTrimmer = event.pageX - rect.left;

  return duration * (xPositionInTrimmer / rect.width); // Calculated time in seconds where the click happened
};

const PlayBar = ({skip, duration = 0, currentTime = 0}) => {
  return (
    <React.Fragment>
      <div className="play-bar play-bar--background"/>
      <div
        className="play-bar play-bar--current-time"
        style={{
          width: `${(currentTime / duration) * 100}%`
        }}
      />
      <div onClick={event => {
        const time = getTimestampAtEvent(event, duration);
        skip(time);
      }} className="play-bar play-bar--clickarea"/>
      <style jsx>{
        `    
        .play-bar {
          position: absolute;
          height: 4px;
          left: 0;
          bottom: 0;
          border-radius: 0px 2px 2px 0px;
          pointer-events: none;
        }
        .play-bar--clickarea {
          pointer-events: auto;
          height: 30px;
          transform: translateY(50%);
          z-index: 100;
          width: 100%;
        }
        .play-bar--current-time {
          background: linear-gradient(90deg, #7146FE 0%, #00FFBE 100%);
        }
        .play-bar--background {
          box-shadow: 0 1px 2px rgba(0,0,0,.1);
          background: rgba(255,255,255,.10);
          width: 100%;
        }
        `
      }</style>
    </React.Fragment>
  );
};

PlayBar.propTypes = {
  skip: PropTypes.func.isRequired,
  duration: PropTypes.number,
  currentTime: PropTypes.number
};

export default class Video extends React.Component {
  static propTypes = {
    src: PropTypes.string.isRequired
  }

  state = {currentTime: 0, duration: null, endTime: null, startTime: 0, isPlaying: false}

  onRef = videoRef => {
    this.videoRef = videoRef;
  };

  onDurationChange = event =>
    this.setState({
      duration: event.target.duration,
      endTime: event.target.duration
    });

  onPlay = () => {
    this.ticker = setInterval(() => {
      if (!this.videoRef) {
        return;
      }
      const {endTime, startTime} = this.state;
      let currentTime = this.videoRef.currentTime;
      if (currentTime > endTime) {
        this.videoRef.currentTime = startTime;
        currentTime = startTime;
      }
      this.setState({currentTime, isPlaying: !this.videoRef.paused});
    }, 1000 / 120);
  };

  onPause = () => this.setState({isPlaying: false});

  onStop = () => this.ticker && clearInterval(this.ticker);

  pause = () => this.videoRef.pause()

  play = () => this.videoRef.play()

  skip = (time = 0) => {
    this.videoRef.currentTime = time;
  };

  componentWillUnmount = () => this.onStop()

  render() {
    const {src} = this.props;
    const {duration, currentTime, isPlaying} = this.state;
    return (<div className="root">
      <video
        ref={this.onRef}
        autoPlay
        loop
        onDurationChange={this.onDurationChange}
        onPlay={this.onPlay}
        onPause={this.onPause}
        onStop={this.onStop}
        preload="auto"
        src={src}
      />
      <div className="controls-container">
        <div className="controls controls--left">
          <PlayPauseButton isPlaying={isPlaying} pause={this.pause} play={this.play}/>
          <CurrentTime currentTime={currentTime}/>
        </div>
        <div className="playbar-container">
          <PlayBar currentTime={currentTime} duration={duration} skip={this.skip}/>
        </div>
        <div className="controls controls--right">
          <AudioButton isMuted={false} toggleMuted={() => {}}/>
          <FullscreenButton isFullscreen={false} toggleFullscreen={() => {}}/>
        </div>
      </div>
      <style jsx global>{`
        .root:hover .play-bar {
          border-radius: 2px 2px 2px 2px;
        }
      `}</style>
      <style jsx>
        {`
        .playbar-container {
          position: absolute;
          left: 0px;
          right: 0px;
          bottom: 0px;
          transition: all 100ms ease;
        }
        .root:hover .playbar-container {
          bottom: 29px;
          left: 122px;
          right: 122px;
        }
        video {
          width: 100%;
          height: auto;
          max.height: calc(100vh - 48px);
          pointer-events: none; // Bug in electron will make elements over the video to have no pointer-events if this is not disabled
        }
        .root {
          height: 100%;
          display: flex;
          align-items: center;
          jusitfy-content: center;
        }
        .controls-container {
          display: block;
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 96px;
          background: linear-gradient(-180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.0) 100%);
          transition: background 100ms ease;
        }
        .root:hover .controls-container {
          background: linear-gradient(-180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.20) 100%);
        }
        .root:hover .controls {
          opacity: 1;
        }
        .controls {
          transition: opacity 200ms ease;
          opacity: 0;
          color: #FFF;
          position: absolute;
          bottom: 16px;
          padding: 0 16px;
          display: flex;
          flex-direction: row;
          align-items: center;
        }
        .controls--left {
          left: 0;
          justify-content: flex-start;
        }
        .controls--right {
          right: 0;
          justify-content: flex-end;
        }
      `}
      </style>
    </div>
    );
  }
}
