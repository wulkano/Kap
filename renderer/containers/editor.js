import {Container} from 'unstated';
import {shake} from '../utils/inputs';

const isMuted = format => ['gif', 'apng'].includes(format);

export default class EditorContainer extends Container {
  state = {
    fps: 15
  }

  setVideoContainer = videoContainer => {
    this.videoContainer = videoContainer;
  }

  mount = (filePath, fps = 15, originalFilePath, resolve) => {
    const src = `file://${filePath}`;
    this.finishLoading = resolve;

    this.setState({src, filePath, originalFilePath, fps, originalFps: fps, wasMuted: false});
    this.videoContainer.setSrc(src);
  }

  setDimensions = (width, height) => {
    this.setState({width, height, ratio: width / height, original: {width, height}});
  }

  changeDimension = (event, {ignoreEmpty = true} = {}) => {
    const {ratio, original, lastValid = {}} = this.state;
    const {currentTarget} = event;
    const {name, value} = currentTarget;
    const updates = {...lastValid, lastValid: null};

    if ((value === '' || value === '0') && ignoreEmpty) {
      const {width, height} = this.state;
      this.setState({width: null, height: null, lastValid: {width, height}});
      return;
    }

    if (value.match(/^\d+$/)) {
      const val = parseInt(value, 10);

      if (name === 'width') {
        const min = Math.max(1, Math.ceil(ratio));
        if (val < min) {
          shake(currentTarget, {className: 'shake-left'});
          updates.width = min;
        } else if (val > original.width) {
          shake(currentTarget, {className: 'shake-left'});
          updates.width = original.width;
        } else {
          updates.width = val;
        }

        updates.height = Math.round(updates.width / ratio);
      } else {
        const min = Math.max(1, Math.ceil(1 / ratio));
        if (val < min) {
          shake(currentTarget, {className: 'shake-right'});
          updates.height = min;
        } else if (val > original.height) {
          shake(currentTarget, {className: 'shake-right'});
          updates.height = original.height;
        } else {
          updates.height = val;
        }

        updates.width = Math.round(updates.height * ratio);
      }
    } else if (name === 'width') {
      shake(currentTarget, {className: 'shake-left'});
    } else {
      shake(currentTarget, {className: 'shake-right'});
    }

    this.setState(updates);
  }

  setOptions = options => {
    const {format, plugin} = this.state;
    const updates = {options};

    if (format) {
      const option = options.find(option => option.format === format);

      if (!option.plugins.find(p => p.title === plugin)) {
        const [{title}] = option.plugins;
        updates.plugin = title;
      }
    } else {
      const [option] = options;
      const [{title}] = option.plugins;
      updates.format = option.format;
      updates.plugin = title;
    }

    this.setState(updates);
  }

  saveOriginal = () => {
    const {filePath, originalFilePath} = this.state;
    const ipc = require('electron-better-ipc');
    ipc.callMain('save-original', {inputPath: originalFilePath || filePath});
  }

  selectFormat = format => {
    const {plugin, options, wasMuted} = this.state;
    const {plugins} = options.find(option => option.format === format);
    const newPlugin = plugins.find(p => p.title === plugin) ? plugin : plugins[0].title;

    if (isMuted(format) && !isMuted(this.state.format)) {
      this.setState({wasMuted: this.videoContainer.state.isMuted});
      this.videoContainer.mute();
    } else if (!isMuted(format) && isMuted(this.state.format) && !wasMuted) {
      this.videoContainer.unmute();
    }

    this.setState({format, plugin: newPlugin});
  }

  selectPlugin = plugin => this.setState({plugin})

  setFps = (value, target, {ignoreEmpty = true} = {}) => {
    const {fps, lastValidFps} = this.state;
    if (value === '') {
      if (ignoreEmpty) {
        this.setState({fps: null, lastValidFps: fps});
      } else {
        this.setState({lastValidFps: null, fps: lastValidFps});
      }

      return;
    }

    if (value.match(/^\d+$/)) {
      const fps = parseInt(value, 10);
      const {originalFps} = this.state;

      if (fps < 1) {
        shake(target);
        this.setState({fps: 1});
      } else if (fps > originalFps) {
        shake(target);
        this.setState({fps: originalFps});
      } else {
        this.setState({fps});
      }
    } else {
      shake(target);
    }
  }

  load = () => {
    this.finishLoading();
  }

  getSnapshot = () => {
    const time = this.videoContainer.state.currentTime;
    const {filePath} = this.state;

    const ipc = require('electron-better-ipc');

    ipc.callMain('export-snapshot', {
      inputPath: filePath,
      time
    });
  }

  startExport = () => {
    const {width, height, fps, filePath, originalFilePath, options, format, plugin: serviceTitle, originalFps} = this.state;
    const {startTime, endTime, isMuted} = this.videoContainer.state;

    const plugin = options.find(option => option.format === format).plugins.find(p => p.title === serviceTitle);
    const {pluginName, isDefault} = plugin;

    const data = {
      exportOptions: {
        width,
        height,
        fps,
        startTime,
        endTime,
        isMuted
      },
      inputPath: originalFilePath || filePath,
      previewPath: filePath,
      pluginName,
      isDefault,
      serviceTitle,
      format,
      originalFps
    };

    const ipc = require('electron-better-ipc');

    ipc.callMain('export', data);
    ipc.callMain('update-usage', {format, plugin: pluginName});
  }
}
