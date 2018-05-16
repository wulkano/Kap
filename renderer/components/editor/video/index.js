import React from 'react';
import PropTypes from 'prop-types';

const PlayBar = ({skip, duration = 0, currentTime = 0}) => {
  return (
    <React.Fragment>
      <div className="play-bar play-bar--background"/>
      <div
        className="play-bar play-bar--current-time"
        onClick={event => {
          const width = event.target.width;
          console.log(width);
          skip(0);
        }}
        style={{
          width: `${(currentTime / duration) * 100}%`
        }}
      />
      <style jsx>{
        `    
        .play-bar {
          position: absolute;
          height: 4px;
          borderRadius: 3px;
          left: 0;
          bottom: 0;
        }
        .play-bar--current-time {
          background: linear-gradient(90deg, rgba(113,70,254,1) 0%, rgba(0,255,190,1) 100%);
          border-radius: 0px 2px 2px 0px;
        }
        .play-bar--background {
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

  state = {currentTime: 0, duration: null, endTime: null, startTime: 0}

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
      this.setState({currentTime});
    }, 1000 / 120);
  };

  onStop = () => this.ticker && clearInterval(this.ticker);

  skip = (time = 0) => {
    this.videoRef.currentTime = time;
  };

  componentWillUnmount = () => this.onStop()

  render() {
    const {src} = this.props;
    const {duration, currentTime} = this.state;
    return (<div className="root">
      <video
        ref={this.onRef}
        autoPlay
        loop
        onDurationChange={this.onDurationChange}
        onPlay={this.onPlay}
        onStop={this.onStop}
        preload="auto"
        src={src}
      />
      <div className="controls">
        <PlayBar currentTime={currentTime} duration={duration} skip={this.skip}/>
      </div>
      <style jsx>
        {`
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
        .controls {
          display: block;
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 32px;
        }
      `}
      </style>
    </div>
    );
  }
}
