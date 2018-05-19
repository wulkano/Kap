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
    containerWidth: PropTypes.number.isRequired
  }

  render() {
    const {
      duration,
      containerWidth,
      setTime,
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
        position={null}
        onStart={() => {
          this.setState({dragging: true});
        }}
        onStop={() => {
          this.setState({dragging: false});
        }}
        bounds={{left: 0, right: containerWidth}}
        onDrag={(event, data) => {
          const time = duration * (data.x / containerWidth);
          setTime(time);
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '-10px',
            zIndex: 100,
            width: '1px'
          }}
        >
          <div
            className="handle"
            style={{
              cursor: this.state.dragging ? '-webkit-grabbing' : '-webkit-grab',
              width: `${HANDLE_WIDTH}px`,
              height: '32px',
              top: '4px',
              left: name === 'end' ? null : `-${HANDLE_WIDTH}px`,
              position: 'relative'
            }}
          >
            <div
              className="handle-visible"
              style={{
                width: '4px',
                height: '16px',
                background: 'white',
                position: 'absolute',
                right: name === 'end' ? undefined : 0,
                left: name === 'end' ? 0 : undefined,
                top: '50%',
                transform: 'translateY(-50%)',
                borderRadius: '3px'
              }}
            />
          </div>
          <style jsx>{`
            .handle {
              -webkit-app-region: no-drag;
              transition: opacity 100ms ease;
              opacity: 0;
            }
            .handle-visible {
              box-shadow: 0 1px 2px rgba(0,0,0,.1);
            }
          `}</style>
        </div>
      </Draggable>
    );
  }
}
