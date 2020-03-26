import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import {connect, VideoContainer, EditorContainer} from '../../containers';

class Video extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
  }

  componentDidMount() {
    const {remote} = electron;
    const {Menu, MenuItem} = remote;
    const {getSnapshot} = this.props;

    this.menu = new Menu();
    this.menu.append(new MenuItem({label: 'Snapshot', click: getSnapshot}));
  }

  componentDidUpdate(prevProps) {
    const {setVideo, src} = this.props;

    if (!prevProps.src && src) {
      setVideo(this.videoRef.current);
    }
  }

  contextMenu = () => {
    const {play, pause} = this.props;
    const video = this.videoRef.current;
    const wasPaused = video.paused;

    if (!wasPaused) {
      pause();
    }

    this.menu.popup({
      callback: () => {
        if (!wasPaused) {
          play();
        }
      }
    });
  }

  render() {
    const {src} = this.props;

    if (!src) {
      return null;
    }

    return (
      <div className="container" onContextMenu={this.contextMenu}>
        <video ref={this.videoRef} preload="auto" src={src}/>
        <style jsx>{`
          video {
            width: 100%;
            height: 100%;
            max-height: calc(100vh - 48px);
          }

          .container {
            flex: 1;
          }
        `}</style>
      </div>
    );
  }
}

Video.propTypes = {
  src: PropTypes.string,
  setVideo: PropTypes.elementType,
  getSnapshot: PropTypes.elementType,
  play: PropTypes.elementType,
  pause: PropTypes.elementType
};

export default connect(
  [VideoContainer, EditorContainer],
  ({src}) => ({src}),
  ({setVideo, play, pause}, {getSnapshot}) => ({setVideo, getSnapshot, play, pause})
)(Video);
