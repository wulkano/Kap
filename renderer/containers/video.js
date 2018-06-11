import {Container} from 'unstated';

export default class VideoContainer extends Container {
  state = {
    ready: false,
    paused: false,
    muted: false,
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

    video.addEventListener('canplaythrough', () => {
      const {ready} = this.state;
      if (!ready) {
        this.editorContainer.load();
        video.play();
        this.setState({ready: true});
      }
    });

    video.addEventListener('play', () => {
      this.checkTime();
      this.setState({paused: false});
    });

    video.addEventListener('pause', () => {
      clearTimeout(this.ticker);
      this.setState({paused: true});
    });

    video.addEventListener('ended', () => {
      const {endTime} = this.state;
      this.updateTime(endTime);
      this.play();
    });
  }

  play = () => {
    this.setState({paused: false});
    this.video.play();
  }

  pause = () => {
    this.setState({paused: true});
    this.video.pause();
  }

  mute = () => {
    this.setState({muted: true});
    this.video.muted = true;
  }

  unmute = () => {
    this.setState({muted: false});
    this.video.muted = false;
  }

  seek = time => {
    this.video.currentTime = time;
  }
}
