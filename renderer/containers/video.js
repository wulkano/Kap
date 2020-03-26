import {Container} from 'unstated';

export default class VideoContainer extends Container {
  state = {
    isReady: false,
    isPaused: false,
    isMuted: false,
    hasAudio: false,
    startTime: 0,
    endTime: 0
  };

  setEditorContainer = editorContainer => {
    this.editorContainer = editorContainer;
  }

  setSrc = src => this.setState({src})

  checkTime = () => {
    if (this.ticker) {
      clearTimeout(this.ticker);
    }

    this.updateTime(this.video.currentTime);
    this.ticker = setTimeout(this.checkTime, 1000 / 120);
  }

  updateTime = currentTime => {
    const {startTime, endTime} = this.state;

    if (currentTime >= endTime) {
      this.setState({currentTime: startTime});
      this.video.currentTime = startTime;
    } else {
      this.setState({currentTime});
    }
  }

  setStartTime = startTime => {
    const {endTime} = this.state;
    if (startTime < endTime) {
      this.video.currentTime = startTime;
      this.setState({startTime, currentTime: startTime});
    }
  }

  setEndTime = endTime => {
    const {startTime} = this.state;
    if (endTime > startTime) {
      this.video.currentTime = endTime;
      this.setState({endTime, currentTime: endTime});
    }
  }

  setVideo = video => {
    this.video = video;

    video.addEventListener('loadedmetadata', () => {
      const {videoWidth, videoHeight, duration} = video;
      this.editorContainer.setDimensions(videoWidth, videoHeight);
      this.setState({duration, startTime: 0, endTime: duration});
    });

    video.addEventListener('loadeddata', () => {
      const hasAudio = video.webkitAudioDecodedByteCount > 0 ||
        Boolean(video.audioTracks && video.audioTracks.length > 0);

      if (!hasAudio) {
        this.mute();
      }

      this.setState({hasAudio});
    });

    video.addEventListener('canplaythrough', () => {
      const {isReady} = this.state;
      if (!isReady) {
        this.editorContainer.load();
        this.play();
        this.setState({isReady: true});
      }
    });

    video.addEventListener('play', () => {
      this.checkTime();
      this.setState({isPaused: false});
    });

    video.addEventListener('pause', () => {
      clearTimeout(this.ticker);
      this.setState({isPaused: true});
    });

    video.addEventListener('ended', () => {
      const {endTime} = this.state;
      this.updateTime(endTime);
      this.play();
    });
  }

  play = async () => {
    try {
      this.playPromise = this.video.play();
      await this.playPromise;
      this.setState({isPaused: false});
    } catch {
      this.setState({isPaused: true});
    } finally {
      this.playPromise = undefined;
    }
  }

  pause = async () => {
    if (this.playPromise) {
      await this.playPromise;
    }

    this.video.pause();
    this.setState({isPaused: true});
  }

  mute = () => {
    this.setState({isMuted: true});
    this.video.muted = true;
  }

  unmute = () => {
    this.setState({isMuted: false});
    this.video.muted = false;
  }

  seek = time => {
    this.video.currentTime = time;
    this.updateTime(time);
  }
}
