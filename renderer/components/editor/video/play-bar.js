import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';

import formatTime from '../../../utils/format-time';

const getTimestampAtEvent = (event, duration) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const xPositionInTrimmer = event.pageX - rect.left;

  return duration * (xPositionInTrimmer / rect.width); // Calculated time in seconds where the click happened
};

const PREVIEW_WIDTH = 132;
class PreviewVideo extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
  }

  static propTypes = {
    time: PropTypes.number,
    src: PropTypes.string.isRequired
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.time && nextProps.time !== this.videoRef.currentTime) {
      this.videoRef.current.currentTime = nextProps.time;
    }
  }

  render() {
    const {src} = this.props;
    return (
      <React.Fragment>
        <video ref={this.videoRef} src={src} width={PREVIEW_WIDTH}/>
        <style jsx>{`
      video {
        border-radius: 4px;
        box-shadow: 0px 0px 16px rgba(0,0,0,.1);
      }
      `}</style>
      </React.Fragment>
    );
  }
}

const HoverTime = ({time, duration, scale, src, showVideo}) => {
  return (
    <div style={{left: `${time ? time * scale : undefined}px`}} className="hover">
      <div className={classNames('preview', {hidden: time === null})}>
        <div className={classNames('video', {hidden: !showVideo})}>
          <PreviewVideo src={src} time={time}/>
        </div>
        <div className="time-container">
          <span className="time">{formatTime(time, duration)}</span>
        </div>
      </div>
      <style jsx>{`
      .hidden {
        opacity: 0;
      }
  .hover {
    position: absolute;
    transform: translate(-50%, -100%);
  }
  .video {
    width: ${PREVIEW_WIDTH}px;
  }
  
  .preview {
    width: ${PREVIEW_WIDTH}px;
    margin-bottom: 16px;
    
  }
  .time-container {
    left: 0px;
    transform: translateY(-32px);
    right: 0px;
    position: absolute;
    text-align: center;
  }
  .time {
    text-wrap: nowrap;
    border-radius: 4px;
    background: rgba(0, 0, 0, .4);
    color: #fff;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: lighter;
  }
  `}</style>
    </div>
  );
};

HoverTime.propTypes = {
  time: PropTypes.number,
  duration: PropTypes.number,
  scale: PropTypes.number,
  src: PropTypes.string,
  showVideo: PropTypes.bool
};

export default class PlayBar extends React.Component {
  static propTypes = {
    skip: PropTypes.func.isRequired,
    duration: PropTypes.number,
    currentTime: PropTypes.number,
    scale: PropTypes.number,
    startTime: PropTypes.number,
    previewDuration: PropTypes.number,
    dragTime: PropTypes.number,
    src: PropTypes.string
  }

  state = {hoverTime: null}

  onMouseMove = event => {
    const {duration} = this.props;
    this.setState({hoverTime: getTimestampAtEvent(event, duration)});
  }

  onMouseLeave = () => {
    this.setState({hoverTime: null});
  }

  render() {
    const {skip, startTime, duration = 0, previewDuration, currentTime = 0, scale = 1, src, dragTime} = this.props;
    const {hoverTime} = this.state;
    const left = startTime * scale;
    const currentTimeClassName = classNames('play-bar', 'play-bar--current-time', {'play-bar--rounded': startTime === 0});
    return (
      <React.Fragment>
        <HoverTime src={src} time={dragTime === null ? hoverTime : dragTime} showVideo={dragTime === null} scale={scale} duration={previewDuration}/>
        <div className="play-bar play-bar--background" style={{opacity: duration === previewDuration ? 0 : 1}}/>
        <div className="play-bar play-bar--playable" style={{
          width: `${(previewDuration * scale)}px`,
          left: `${left}px`
        }}/>
        <div
          className={currentTimeClassName}
          style={{
            width: `${(currentTime * scale)}px`,
            left: `${left}px`
          }}
        />
        <div
          onMouseMove={this.onMouseMove}
          onMouseLeave={this.onMouseLeave}
          onClick={event => {
            const time = getTimestampAtEvent(event, duration);
            skip(time);
          }}
          className="play-bar play-bar--clickarea"
        />
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
          transition: opacity 200ms ease;
          background: rgba(255,255,255,.40);
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
  }
}
