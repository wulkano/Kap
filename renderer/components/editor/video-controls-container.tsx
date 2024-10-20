import {createContainer} from 'unstated-next';
import {useRef, useState, useEffect} from 'react';
import {ipcRenderer} from 'electron-better-ipc';

const useVideoControls = () => {
  const videoRef = useRef<HTMLVideoElement>();
  const wasPaused = useRef(true);
  const transitioningPauseState = useRef<Promise<void>>();

  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  const play = async () => {
    if (videoRef.current?.paused) {
      transitioningPauseState.current = videoRef.current.play();
      try {
        await transitioningPauseState.current;
        setIsPaused(false);
      } catch {}
    }
  };

  const pause = async () => {
    if (videoRef.current && !videoRef.current.paused) {
      try {
        await transitioningPauseState.current;
      } catch {} finally {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const mute = () => {
    setIsMuted(true);
    videoRef.current.muted = true;
  };

  const unmute = () => {
    setIsMuted(false);
    videoRef.current.muted = false;
  };

  const setVideoRef = (video: HTMLVideoElement) => {
    videoRef.current = video;
    setIsPaused(video.paused);

    if (video.paused) {
      play();
    }
  };

  const videoProps = {
    onCanPlayThrough: hasStarted ? undefined : () => {
      setHasStarted(true);
      ipcRenderer.callMain<never, {isFocused: boolean}>('get-window-info').then(windowInfo => {
        if (windowInfo.isFocused) {
          play();
        }
      });
    },
    onLoadedData: () => {
      const hasAudio = (videoRef.current as any).webkitAudioDecodedByteCount > 0 || Boolean(
        (videoRef.current as any).audioTracks &&
        (videoRef.current as any).audioTracks.length > 0
      );

      if (!hasAudio) {
        mute();
      }
    },
    onEnded: () => {
      play();
    }
  };

  useEffect(() => {
    const blurListener = () => {
      wasPaused.current = videoRef.current?.paused;
      if (!wasPaused.current) {
        pause();
      }
    };

    const focusListener = () => {
      if (!wasPaused.current) {
        play();
      }
    };

    ipcRenderer.callMain('focus-events');

    const unsubscribeFocus = ipcRenderer.answerMain('window-focus', focusListener);
    const unsubscribeBlur = ipcRenderer.answerMain('window-blur', blurListener);

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      ipcRenderer.callMain('stop-focus-events');
    };
  }, []);

  return {
    isPaused,
    isMuted,
    setVideoRef,
    pause,
    play,
    mute,
    unmute,
    videoProps
  };
};

const VideoControlsContainer = createContainer(useVideoControls);

export default VideoControlsContainer;
