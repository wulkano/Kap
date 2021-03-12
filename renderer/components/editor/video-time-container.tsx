import {createContainer} from 'unstated-next';
import {useRef, useState, useEffect} from 'react';

const useVideoTime = () => {
  const videoRef = useRef<HTMLVideoElement>();

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const setVideoRef = (video: HTMLVideoElement) => {
    videoRef.current = video;
  };

  const videoProps = {
    onLoadedMetadata: () => {
      if (duration === 0) {
        setDuration(videoRef.current?.duration);
        setEndTime(videoRef.current?.duration);
      }
    },
    onEnded: () => {
      updateTime(startTime);
    }
  };

  const updateTime = (time: number, ignoreElement = false) => {
    if (time >= endTime && !videoRef.current.paused) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    } else {
      if (!ignoreElement) {
        videoRef.current.currentTime = time;
      }

      setCurrentTime(time);
    }
  };

  const updateStartTime = (time: number) => {
    if (time < endTime) {
      videoRef.current.currentTime = time;
      setStartTime(time);
      setCurrentTime(time);
    }
  };

  const updateEndTime = (time: number) => {
    if (time > startTime) {
      videoRef.current.currentTime = time;
      setEndTime(time);
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    const interval = setInterval(() => {
      updateTime(videoRef.current.currentTime ?? 0, true);
    }, 1000 / 30);

    return () => {
      clearInterval(interval);
    };
  }, [startTime, endTime]);

  return {
    startTime,
    endTime,
    duration,
    currentTime,
    updateTime,
    updateStartTime,
    updateEndTime,
    setVideoRef,
    videoProps
  };
};

const VideoTimeContainer = createContainer(useVideoTime);

export default VideoTimeContainer;
