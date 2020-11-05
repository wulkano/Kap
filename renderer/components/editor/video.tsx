import {useRef, useMemo, useEffect, RefObject} from 'react';
import useWindowState from '../../hooks/window-state';
import VideoTimeContainer from './video-time-container';
import VideoMetadataContainer from './video-metadata-container';
import VideoControlsContainer from './video-controls-container';

const getVideoProps = (propsArray: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>[]) => {
  const handlers = new Map();

  for (const props of propsArray) {
    for (const [key, handler] of Object.entries(props)) {
      if (!handlers.has(key)) {
        handlers.set(key, []);
      }

      handlers.get(key).push(handler);
    }
  }

  return [...handlers.entries()].reduce((acc, [key, handlerList]) => ({
    ...acc,
    [key]: () => {
      for (const handler of handlerList) {
        handler?.()
      }
    }
  }), {});
};

const Video = () => {
  const videoRef = useRef();
  const {filePath} = useWindowState();
  const src = `file://${filePath}`;

  const videoTimeContainer = VideoTimeContainer.useContainer();
  const videoMetadataContainer = VideoMetadataContainer.useContainer();
  const videoControlsContainer = VideoControlsContainer.useContainer();

  useEffect(() => {
    videoTimeContainer.setVideoRef(videoRef.current);
    videoMetadataContainer.setVideoRef(videoRef.current);
    videoControlsContainer.setVideoRef(videoRef.current);
  }, []);

  const videoProps = getVideoProps([
    videoTimeContainer.videoProps,
    videoMetadataContainer.videoProps,
    videoControlsContainer.videoProps
  ]);

  return (
    <div>
      <video ref={videoRef} preload="auto" src={src} {...videoProps}/>
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

export default Video;

// import electron from 'electron';
// import PropTypes from 'prop-types';
// import React, {useRef} from 'react';

// import {connect, VideoContainer, EditorContainer} from '../../containers';

// class Video extends React.Component {
//   constructor(props) {
//     super(props);
//     this.videoRef = React.createRef();
//   }

//   componentDidMount() {
//     const {remote} = electron;
//     const {Menu, MenuItem} = remote;
//     const {getSnapshot} = this.props;

//     this.menu = new Menu();
//     this.menu.append(new MenuItem({label: 'Snapshot', click: getSnapshot}));
//   }

//   componentDidUpdate(previousProps) {
//     const {setVideo, src} = this.props;

//     if (!previousProps.src && src) {
//       setVideo(this.videoRef.current);
//     }
//   }

//   contextMenu = () => {
//     const {play, pause} = this.props;
//     const video = this.videoRef.current;
//     const wasPaused = video.paused;

//     if (!wasPaused) {
//       pause();
//     }

//     this.menu.popup({
//       callback: () => {
//         if (!wasPaused) {
//           play();
//         }
//       }
//     });
//   }

//   render() {
//     const {src} = this.props;

//     if (!src) {
//       return null;
//     }

//     return (
//       <div className="container" onContextMenu={this.contextMenu}>
//         <video ref={this.videoRef} preload="auto" src={src}/>
//         <style jsx>{`
          // video {
          //   width: 100%;
          //   height: 100%;
          //   max-height: calc(100vh - 48px);
          // }

          // .container {
          //   flex: 1;
          // }
//         `}</style>
//       </div>
//     );
//   }
// }

// Video.propTypes = {
//   src: PropTypes.string,
//   setVideo: PropTypes.elementType,
//   getSnapshot: PropTypes.elementType,
//   play: PropTypes.elementType,
//   pause: PropTypes.elementType
// };

// export default connect(
//   [VideoContainer, EditorContainer],
//   ({src}) => ({src}),
//   ({setVideo, play, pause}, {getSnapshot}) => ({setVideo, getSnapshot, play, pause})
// )(Video);
