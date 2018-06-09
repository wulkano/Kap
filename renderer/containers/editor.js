import {Container} from 'unstated';

export default class EditorContainer extends Container {
  state ={
    fps: 15,
    formats: ['gif', 'mp4', 'webm', 'apng'],
    fpsOptions: [6, 10, 12, 15, 20, 25, 30, 60]
  }

  setVideoContainer = videoContainer => {
    this.videoContainer = videoContainer;
  }

  mount = (filePath, fps = 15, resolve) => {
    const src = `file://${filePath}`;
    this.finishLoading = resolve;

    const fpsOptions = this.state.fpsOptions.filter(opt => opt <= fps);
    const defaultFps = fpsOptions.sort((a, b) => b - a).find(opt => opt === fps) || fpsOptions[fpsOptions.length - 1];

    this.setState({src, filePath, fps: Math.min(defaultFps, 30), fpsOptions, originalFps: fps});
    this.videoContainer.setSrc(src);
  }

  setDimensions = (width, height) => {
    this.setState({width, height, ratio: width / height});
  }

  changeDimension = event => {
    this.setState({[event.target.name]: event.target.value});
  }

  setOptions = options => {
    const [format] = this.state.formats;
    const [{title: plugin}] = options[format].plugins;
    this.setState({options, format, plugin});
  }

  selectFormat = format => {
    const {plugin, options, fps} = this.state;
    const {plugins} = options[format];
    const newPlugin = plugins.find(p => p.title === plugin) ? plugin : plugins[0].title;

    const newFps = fps === 60 && (format === 'gif' || format === 'apng') ? 30 : fps;

    this.setState({format, plugin: newPlugin, fps: newFps});
  }

  selectPlugin = plugin => this.setState({plugin})

  setFps = fps => this.setState({fps: parseInt(fps, 10)})

  load = () => {
    this.finishLoading();
  }

  startExport = () => {
    const {width, height, fps, filePath, options, format, plugin, originalFps} = this.state;
    const {startTime, endTime} = this.videoContainer.state;

    const pluginName = options[format].plugins.find(p => p.title === plugin).pluginName;

    const data = {
      exportOptions: {
        width,
        height,
        fps,
        startTime,
        endTime
      },
      inputPath: filePath,
      pluginName,
      serviceTitle: plugin,
      format,
      originalFps
    };

    const ipc = require('electron-better-ipc');

    ipc.callMain('export', data);
  }
}
