import React from 'react';
import PropTypes from 'prop-types';

import PlayPauseButton from '../buttons/play-pause';
import FullscreenButton from '../buttons/fullscreen';
import AudioButton from '../buttons/audio';

import formatTime from '../../../utils/format-time';
import Handle from './handle';
import PlayBar from './play-bar';

const TIMELINE_PADDING = 122;

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

export default class Video extends React.Component {
  static propTypes = {
    src: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
  }

  state = {currentTime: 0, duration: null, endTime: null, startTime: 0, isPlaying: false, width: 0, hasFocus: false}

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
    this.videoRef.current.currentTime = this.state.startTime;
    this.videoRef.current.play();
  }

  onDurationChange = event =>
    this.setState({
      duration: event.currentTarget.duration,
      endTime: event.currentTarget.duration
    });

    refreshTime = () => {
      if (!this.videoRef) {
        return;
      }
      const {endTime, startTime, isPlaying} = this.state;
      let currentTime = this.videoRef.current.currentTime;
      if (currentTime >= endTime && isPlaying) {
        this.videoRef.current.currentTime = startTime;
        currentTime = startTime;
      }
      this.setState({currentTime, isPlaying: !this.videoRef.current.paused});
      if (this.ticker) {
        clearTimeout(this.ticker);
      }
      this.ticker = setTimeout(this.refreshTime, 1000 / 120);
    }

  onPlay = () => {
    this.refreshTime();
  };

  onPause = () => this.setState({isPlaying: false});

  onStop = () => this.ticker && clearTimeout(this.ticker);

  pause = () => {
    this.videoRef.current.pause();
    if (this.ticker) {
      clearTimeout(this.ticker);
    }
  }

  play = () => this.videoRef.current.play()

  skip = (time = 0) => {
    this.setState({currentTime: time});
    this.videoRef.current.currentTime = time;
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
      return this.state.width - (TIMELINE_PADDING * 2);
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

  handleDragStop = () => {
    this.setState({dragName: null});
  }

  handleDragStart = event => {
    this.setState({dragName: event.name});
  }

  get dragTime() {
    const {dragName, startTime, endTime} = this.state;
    if (dragName === 'start') {
      return startTime;
    }

    if (dragName === 'end') {
      return endTime;
    }

    return null;
  }

  render() {
    const {src} = this.props;
    const {duration, isPlaying, startTime, endTime} = this.state;
    const width = this.width;
    const scale = width / duration;
    return (
      <div className="root" onMouseEnter={() => this.setState({hasFocus: true})} onMouseLeave={() => this.setState({hasFocus: false})}>
        <video
          ref={this.videoRef}
          autoPlay
          onDurationChange={this.onDurationChange}
          onPlay={this.onPlay}
          loop={endTime === duration && startTime === 0}
          onPause={this.onPause}
          onEnded={this.onEnded}
          preload="auto"
          src={src}
        />
        <div className="controls-container">
          <div className="controls controls--left">
            <PlayPauseButton isPlaying={isPlaying} onClick={isPlaying ? this.pause : this.play}/>
            <CurrentTime currentTime={this.currentPreviewTime}/>
          </div>
          <div className="playbar-container">
            <PlayBar dragTime={this.dragTime} src={src} previewDuration={this.previewDuration} scale={scale} startTime={startTime} endTime={endTime} currentTime={this.currentPreviewTime} duration={duration} skip={this.skip}/>
            <Handle onDragStart={this.handleDragStart} onDragStop={this.handleDragStop} limitLeft={0} limitRight={endTime * scale} play={this.play} pause={this.pause} duration={duration} containerWidth={width} name="start" time={startTime} setTime={this.setStartTime}/>
            {endTime !== null && <Handle onDragStart={this.handleDragStart} onDragStop={this.handleDragStop} limitLeft={startTime * scale} limitRight={width} play={this.play} pause={this.pause} duration={duration} containerWidth={width} name="end" time={endTime} setTime={this.setEndTime}/>}
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
            left: ${TIMELINE_PADDING}px;
            right: ${TIMELINE_PADDING}px;
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
            color: #fff;
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
