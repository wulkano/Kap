import {Container} from 'unstated';

export default class EditorContainer extends Container {
  state ={
    fps: 30,
    formats: ['gif', 'mp4', 'webm', 'apng'],
    fpsOptions: [15, 30]
  }

  setVideoContainer = videoContainer => {
    this.videoContainer = videoContainer;
  }

  mount = (filePath, resolve) => {
    const src = `file://${filePath}`;
    this.finishLoading = resolve;
    this.setState({src, filePath});
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
    const {plugin, options} = this.state;
    const {plugins} = options[format];
    const newPlugin = plugins.find(p => p.title === plugin) ? plugin : plugins[0].title;
    this.setState({format, plugin: newPlugin});
  }

  selectPlugin = plugin => this.setState({plugin})

  setFps = fps => this.setState({fps})

  load = () => {
    this.finishLoading();
  }

  startExport = () => {
    const {width, height, fps, filePath, options, format, plugin} = this.state;
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
      format
    };

    const ipc = require('electron-better-ipc');

    ipc.callMain('export', data);
  }
}
