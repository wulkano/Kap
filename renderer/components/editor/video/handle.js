import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

const HANDLE_WIDTH = 16;
export default class Handle extends React.Component {
  state = {dragging: false};

  static propTypes = {
    name: PropTypes.string.isRequired,
    duration: PropTypes.number,
    setTime: PropTypes.func.isRequired,
    time: PropTypes.number,
    limitLeft: PropTypes.number,
    limitRight: PropTypes.number,
    containerWidth: PropTypes.number.isRequired,
    play: PropTypes.func.isRequired,
    pause: PropTypes.func.isRequired
  }

  onDragStart = () => {
    const {pause, setTime, time} = this.props;
    pause();
    setTime(time);
    this.setState({dragging: true});
  }

  onDragStop = () => {
    const {play} = this.props;
    play();
    this.setState({dragging: false});
  }

  onDrag = (event, data) => {
    const {duration, containerWidth, setTime} = this.props;
    const time = duration * (data.x / containerWidth);
    setTime(time);
  }

  render() {
    const {
      duration,
      containerWidth,
      limitLeft,
      limitRight,
      time = 0,
      name
    } = this.props;
    const scale = containerWidth / duration;
    const left = time * scale;

    return (
      <Draggable
        axis="x"
        handle=".handle"
        defaultPosition={{x: time && left, y: 0}}
        position={{x: time && left, y: 0}}
        onStart={this.onDragStart}
        onStop={this.onDragStop}
        bounds={{left: limitLeft, right: limitRight}}
        onDrag={this.onDrag}
      >
        <div
          className="slider"
        >
          <div
            className="handle"
            style={{
              cursor: this.state.dragging ? '-webkit-grabbing' : '-webkit-grab',
              width: `${HANDLE_WIDTH}px`,
              left: name === 'end' ? null : `-${HANDLE_WIDTH}px`
            }}
          >
            <div
              className="handle-visible"
              style={{
                right: name === 'end' ? undefined : 0,
                left: name === 'end' ? 0 : undefined
              }}
            />
          </div>
          <style jsx>{`
            .handle {
              height: 32px;
              top: 4px;
              position: relative;
            }
            .slider {
              position: absolute;
              bottom: -10px;
              z-index: 100;
              width: 1px;
            }
            .handle {
              -webkit-app-region: no-drag;
              transition: opacity 100ms ease;
              opacity: 0;
            }
            .handle-visible {
              box-shadow: 0 1px 2px rgba(0,0,0,.1);
              width: 4px;
              height: 16px;
              background: white;
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              border-radius: 3px;
            }
          `}</style>
          <style jsx global>{`
          .react-draggable-transparent-selection  {
            // Prevent cursor from flickering
            cursor: -webkit-grabbing !important;
          }
          `}</style>
        </div>
      </Draggable>
    );
  }
}
