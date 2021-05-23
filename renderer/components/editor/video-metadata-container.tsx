import {createContainer} from 'unstated-next';
import {useRef, useState} from 'react';
import {useShowWindow} from '../../hooks/use-show-window';

const useVideoMetadata = () => {
  const videoRef = useRef<HTMLVideoElement>();

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const [duration, setDuration] = useState(0);
  useShowWindow(duration !== 0);

  const setVideoRef = (video: HTMLVideoElement) => {
    videoRef.current = video;
  };

  const videoProps = {
    onLoadedMetadata: () => {
      setWidth(videoRef.current?.videoWidth);
      setHeight(videoRef.current?.videoHeight);
      setDuration(videoRef.current?.duration);
    },
    onLoadedData: () => {
      const hasAudio = (videoRef.current as any).webkitAudioDecodedByteCount > 0 || Boolean(
        (videoRef.current as any).audioTracks &&
        (videoRef.current as any).audioTracks.length > 0
      );

      if (!hasAudio) {
        videoRef.current.muted = true;
      }

      setHasAudio(hasAudio);
    }
  };

  return {
    width,
    height,
    hasAudio,
    duration,
    setVideoRef,
    videoProps
  };
};

const VideoMetadataContainer = createContainer(useVideoMetadata);

export default VideoMetadataContainer;

