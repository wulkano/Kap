import PropTypes from 'prop-types';
import React from 'react';

import {connect, VideoContainer} from '../../containers';

class Video extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    const {setVideo, src} = this.props;

    if (!prevProps.src && src) {
      setVideo(this.videoRef.current);
    }
  }

  render() {
    const {src} = this.props;

    if (!src) {
      return null;
    }

    return (
      <div className="container">
        <video ref={this.videoRef} preload="auto" src={src}/>
        <style jsx>{`
          video {
            width: 100%;
            height: 100%;
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
  setVideo: PropTypes.func
};

export default connect(
  [VideoContainer],
  ({src}) => ({src}),
  ({setVideo}) => ({setVideo})
)(Video);
