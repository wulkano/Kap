import React from 'react';
import PropTypes from 'prop-types';

import PlayPauseButton from '../buttons/play-pause';
import FullscreenButton from '../buttons/fullscreen';
import AudioButton from '../buttons/audio';

import formatTime from '../../../utils/format-time';
import Handle from './handle';

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

const PlayBar = ({skip, startTime, duration = 0, previewDuration, currentTime = 0, scale = 1}) => {
  const left = startTime * scale;
  const roundedLeft = startTime === 0 ? '' : 'play-bar--rounded';
  return (
    <React.Fragment>
      <div className="play-bar play-bar--background"/>
      <div className="play-bar play-bar--playable" style={{
        width: `${(previewDuration * scale)}px`,
        left: `${left}px`
      }}/>
      <div
        className={`play-bar play-bar--current-time ${roundedLeft}`}
        style={{
          width: `${(currentTime * scale)}px`,
          left: `${left}px`
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
          -webkit-app-region: no-drag;
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
          background: rgba(0,0,0,.20);
          width: 100%;
        }
        .play-bar--playable {
          background: rgba(255,255,255,.40);
          width: 100%;
        }
        .play-bar--rounded {
          border-radius: 2px 2px 2px 2px;
        }
        `
      }</style>
    </React.Fragment>
  );
};

PlayBar.propTypes = {
  skip: PropTypes.func.isRequired,
  duration: PropTypes.number,
  currentTime: PropTypes.number,
  scale: PropTypes.number,
  startTime: PropTypes.number,
  previewDuration: PropTypes.number
};

export default class Video extends React.Component {
  static propTypes = {
    src: PropTypes.string.isRequired
  }

  state = {currentTime: 0, duration: null, endTime: null, startTime: 0, isPlaying: false, width: 0, hasFocus: false}

  onRef = videoRef => {
    this.videoRef = videoRef;
  };

  handleResize = () => this.setState({...this.state, width: window.innerWidth});

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    this.onStop();
    window.removeEventListener('resize', this.handleResize);
  }

  onEnded = () => {
    this.videoRef.currentTime = this.state.startTime;
    this.videoRef.play();
  }

  onDurationChange = event =>
    this.setState({
      duration: event.target.duration,
      endTime: event.target.duration
    });

    refreshTime = () => {
      if (!this.videoRef) {
        return;
      }
      const {endTime, startTime} = this.state;
      let currentTime = this.videoRef.currentTime;
      if (currentTime >= endTime) {
        this.videoRef.currentTime = startTime;
        currentTime = startTime;
      }
      this.setState({currentTime, isPlaying: !this.videoRef.paused});
      this.ticker = setTimeout(this.refreshTime, 1000 / 120);
    }

  onPlay = () => {
    this.refreshTime();
  };

  onPause = () => this.setState({isPlaying: false});

  onStop = () => this.ticker && clearTimeout(this.ticker);

  pause = () => {
    this.videoRef.pause();
    if (this.ticker) {
      clearTimeout(this.ticker);
    }
  }

  play = () => this.videoRef.play()

  skip = (time = 0) => {
    this.videoRef.currentTime = time;
  };

  setStartTime = startTime => {
    this.setState({startTime, currentTime: startTime});
    this.skip(startTime);
  }

  setEndTime = endTime => {
    this.setState({endTime, currentTime: endTime});
    this.skip(endTime);
  }

  get width() {
    const {hasFocus} = this.state;
    if (hasFocus) {
      return this.state.width - (122 * 2);
    }

    return this.state.width;
  }

  get previewDuration() {
    const {startTime, endTime} = this.state;
    return endTime - startTime;
  }

  get currentPreviewTime() {
    const {startTime, currentTime} = this.state;
    return Math.max(currentTime - startTime, 0);
  }

  render() {
    const {src} = this.props;
    const {duration, isPlaying, startTime, endTime} = this.state;
    const width = this.width;
    const scale = width / duration;
    return (<div className="root" onMouseEnter={() => this.setState({hasFocus: true})} onMouseLeave={() => this.setState({hasFocus: false})}>
      <video
        ref={this.onRef}
        autoPlay
        onDurationChange={this.onDurationChange}
        onPlay={this.onPlay}
        onPause={this.onPause}
        onStop={this.onStop}
        onEnded={this.onEnded}
        preload="auto"
        src={src}
      />
      <div className="controls-container">
        <div className="controls controls--left">
          <PlayPauseButton isPlaying={isPlaying} pause={this.pause} play={this.play}/>
          <CurrentTime currentTime={this.currentPreviewTime}/>
        </div>
        <div className="playbar-container">
          <PlayBar previewDuration={this.previewDuration} scale={scale} startTime={startTime} endTime={endTime} currentTime={this.currentPreviewTime} duration={duration} skip={this.skip}/>
          <Handle limitLeft={0} limitRight={endTime * scale} play={this.play} pause={this.pause} duration={duration} containerWidth={width} name="start" time={startTime} setTime={this.setStartTime}/>
          {endTime && <Handle limitLeft={startTime * scale} limitRight={width} play={this.play} pause={this.pause} duration={duration} containerWidth={width} name="end" time={endTime} setTime={this.setEndTime}/>}
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
        .controls-container:hover .handle {
          opacity: 1;
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
          transition: all 100ms ease;
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
