import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import {connect, VideoContainer} from '../../../containers';
import Preview from './preview';

class PlayBar extends React.Component {
  state = {
    hoverTime: 0
  };

  progress = React.createRef();

  getTimeFromEvent = event => {
    const {startTime, endTime} = this.props;

    const cursorX = event.clientX;
    const {x, width} = this.progress.current.getBoundingClientRect();

    const percent = (cursorX - x) / width;
    const time = startTime + ((endTime - startTime) * percent);

    return Math.max(0, time);
  }

  seek = event => {
    const {startTime, endTime, seek} = this.props;
    const time = this.getTimeFromEvent(event);

    if (startTime <= time && time <= endTime) {
      seek(time);
    }
  }

  updatePreview = event => {
    const time = this.getTimeFromEvent(event);
    this.setState({hoverTime: time});
  }

  startResizing = () => {
    const {pause} = this.props;
    this.setState({resizing: true});
    pause();
  }

  stopResizing = () => {
    const {play} = this.props;
    this.setState({resizing: false});
    play();
  }

  setStartTime = event => this.props.setStartTime(Number.parseFloat(event.target.value))

  setEndTime = event => this.props.setEndTime(Number.parseFloat(event.target.value))

  render() {
    const {currentTime = 0, duration, startTime, endTime, hover, src} = this.props;

    if (!src) {
      return null;
    }

    const {hoverTime, resizing} = this.state;

    const total = endTime - startTime;
    const current = currentTime - startTime;

    const previewTime = resizing ? currentTime : hoverTime;
    const previewLabelTime = resizing ? currentTime : (startTime <= hoverTime && hoverTime <= endTime ? hoverTime - startTime : hoverTime);
    const previewDuration = resizing ? total : (startTime <= hoverTime && hoverTime <= endTime ? total : undefined);

    const className = classNames('progress-bar-container', {hover});

    return (
      <div className="container" onMouseUp={this.seek} onMouseMove={this.updatePreview}>
        <div className={className}>
          <div className="progress-bar">
            <progress ref={this.progress} max={total} value={current}/>
            <div className="preview">
              <Preview src={src} time={previewTime} labelTime={previewLabelTime} duration={previewDuration} hidePreview={resizing}/>
            </div>
            <input
              type="range"
              className="slider start"
              value={startTime}
              min={0}
              max={duration}
              step={0.00001}
              onChange={this.setStartTime}
              onMouseDown={this.startResizing}
              onMouseUp={this.stopResizing}/>
            <input
              type="range"
              className="slider end"
              value={endTime}
              min={0}
              max={duration}
              step={0.00001}
              onChange={this.setEndTime}
              onMouseDown={this.startResizing}
              onMouseUp={this.stopResizing}/>
          </div>
        </div>
        <style jsx>{`
            .container {
              flex: 1;
              display: flex;
              align-items: center;
              z-index: 25;
              overflow: visible;
              height: 50%;
            }

            .progress-bar-container {
              position: absolute;
              width: 100%;
              display: flex;
              bottom: 30px;
              left: 50%;
              transform: translateX(-50%);
              width: 60%;
              transition: all 0.12s ease-in-out;
            }

            .progress-bar-container:not(.hover) {
              bottom: 64px;
              width: 100%
            }

            .progress-bar-container:not(.hover) .progress-bar {
              border-radius: 0;
            }

            .progress-bar {
              width: 100%;
              height: 4px;
              display: flex;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 4px;
              position: relative;
            }

            progress {
              position: absolute;
              top: 0;
              width: ${total * 100 / duration}%;
              left: ${startTime * 100 / duration}%;
              -webkit-appearance: none;
              height: 4px;
              border-radius: 4px;
            }

            progress::-webkit-progress-bar {
              background-color: rgba(255, 255, 255, 0.4);
              border-radius: 4px;
            }

            progress::-webkit-progress-value {
              border-radius: 4px;
              background-image: linear-gradient(90deg, #9300ff 0%, #5272e2 49%, #05e6b5 98%);
              box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.1);
            }

            .slider {
              width: 100%;
              height: 4px;
              position: absolute;
              margin: 0;
              top: 0;
              -webkit-appearance: none;
              outline: none;
              background: transparent;
              pointer-events: none;
              ${hover ? '' : 'display: none;'}
            }

            .slider::-ms-track {
              width: 100%;
              height: 0;
              border-color: transparent;
              color: transparent;
              background: transparent;
              pointer-events: none;
              z-index: -1;
            }

            .slider::-webkit-slider-thumb {
              width: 5px;
              height: 16px;
              background: #fff;
              border-radius: 2px;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              transition: all 0.16s ease-in-out;
              -webkit-appearance: none;
              pointer-events: auto;
              z-index: 20;
            }

            .preview {
              position: absolute;
              left: ${hoverTime * 100 / duration}%;
              transform: translateX(-50%);
              bottom: 20px;
              width: 132px;
              height: 88px;
              display: none;
            }

            .container:hover .preview {
              display: flex;
            }
        `}</style>
      </div>
    );
  }
}

PlayBar.propTypes = {
  startTime: PropTypes.number,
  endTime: PropTypes.number,
  seek: PropTypes.elementType,
  currentTime: PropTypes.number,
  duration: PropTypes.number,
  src: PropTypes.string,
  setStartTime: PropTypes.elementType,
  setEndTime: PropTypes.elementType,
  pause: PropTypes.elementType,
  play: PropTypes.elementType,
  hover: PropTypes.bool
};

export default connect(
  [VideoContainer],
  ({currentTime, duration, startTime, endTime, src}) => ({currentTime, duration, startTime, endTime, src}),
  ({seek, setStartTime, setEndTime, pause, play}) => ({seek, setStartTime, setEndTime, pause, play})
)(PlayBar);
