import {useRef, useEffect} from 'react';
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
      `}</style>
    </div>
  );
}

export default Video;
