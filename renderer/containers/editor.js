import {Container} from 'unstated';
import {ipcRenderer as ipc} from 'electron-better-ipc';
import * as stringMath from 'string-math';
import {shake} from '../utils/inputs';

const isMuted = format => ['gif', 'apng'].includes(format);

export default class EditorContainer extends Container {
  state = {}

  setVideoContainer = videoContainer => {
    this.videoContainer = videoContainer;
  }

  mount = ({filePath, fps = 15, originalFilePath, isNewRecording, recordingName, title}, resolve) => {
    const src = `file://${filePath}`;
    this.finishLoading = resolve;

    this.setState({
      src,
      filePath,
      originalFilePath,
      recordingName,
      title,
      fps: Math.min(fps, this.state.fps),
      originalFps: fps,
      wasMuted: false,
      isNewRecording
    });
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

    if (!value.match(/^\d+$/) && ignoreEmpty) {
      const {width, height, lastValid = {}} = this.state;
      this.setState({[name]: value, lastValid: {width, height, ...lastValid}});
      return;
    }

    let parsedValue;
    try {
      parsedValue = stringMath(value);
    } catch {}

    if (parsedValue) {
      const roundedValue = Math.round(parsedValue);

      if (name === 'width') {
        const min = Math.max(1, Math.ceil(ratio));

        if (ignoreEmpty) {
          updates.width = roundedValue;
        } else if (roundedValue < min) {
          shake(currentTarget, {className: 'shake-left'});
          updates.width = min;
        } else if (roundedValue > original.width) {
          shake(currentTarget, {className: 'shake-left'});
          updates.width = original.width;
        } else {
          updates.width = roundedValue;
        }

        updates.height = Math.floor(updates.width / ratio);
      } else {
        const min = Math.max(1, Math.ceil(1 / ratio));

        if (ignoreEmpty) {
          updates.height = roundedValue;
        } else if (roundedValue < min) {
          shake(currentTarget, {className: 'shake-right'});
          updates.height = min;
        } else if (roundedValue > original.height) {
          shake(currentTarget, {className: 'shake-right'});
          updates.height = original.height;
        } else {
          updates.height = roundedValue;
        }

        updates.width = Math.ceil(updates.height * ratio);
      }
    } else if (name === 'width') {
      shake(currentTarget, {className: 'shake-left'});
    } else {
      shake(currentTarget, {className: 'shake-right'});
    }

    this.setState(updates);
  }

  openEditPluginConfig = async () => {
    const {editPlugin, filePath} = this.state;

    await ipc.callMain('open-edit-config', {
      pluginName: editPlugin.pluginName,
      serviceTitle: editPlugin.title,
      filePath
    });

    ipc.callMain('refresh-usage');
  }

  setOptions = ({exportOptions = [], editOptions = [], fps}) => {
    const {format, plugin, editPlugin} = this.state;
    const updates = {options: exportOptions, editOptions, fpsOptions: fps};

    if (format) {
      const option = exportOptions.find(option => option.format === format);

      if (!option.plugins.find(p => p.title === plugin)) {
        const [{title}, {title: secondTitle} = {}] = option.plugins;
        updates.plugin = title === 'Open With' ? secondTitle : title;
      }
    } else {
      const [option] = exportOptions;
      const [{title}, {title: secondTitle} = {}] = option.plugins;
      updates.format = option.format;
      updates.plugin = title === 'Open With' ? secondTitle : title;
    }

    if (!this.state.fps && fps && fps[updates.format]) {
      updates.fps = fps[updates.format];
    }

    if (editPlugin) {
      updates.editPlugin = editOptions.find(({title, pluginName}) => title === editPlugin.title && pluginName === editPlugin.pluginName);
    }

    this.setState(updates);
  }

  saveOriginal = () => {
    const {filePath, originalFilePath} = this.state;
    ipc.callMain('save-original', {inputPath: originalFilePath || filePath});
  }

  selectFormat = format => {
    const {plugin, options, wasMuted, fpsOptions, originalFps} = this.state;
    const {plugins} = options.find(option => option.format === format);
    const newPlugin = plugin !== 'Open With' && plugins.find(p => p.title === plugin) ? plugin : plugins[0].title;

    if (this.videoContainer.state.hasAudio) {
      if (isMuted(format) && !isMuted(this.state.format)) {
        this.setState({wasMuted: this.videoContainer.state.isMuted});
        this.videoContainer.mute();
      } else if (!isMuted(format) && isMuted(this.state.format) && !wasMuted) {
        this.videoContainer.unmute();
      }
    }

    const updates = {format, plugin: newPlugin, openWithApp: null};

    if (fpsOptions && fpsOptions[format]) {
      updates.fps = Math.min(originalFps, fpsOptions[format]);
    }

    this.setState(updates);
  }

  selectPlugin = plugin => {
    if (plugin === 'open-plugins') {
      ipc.callMain('open-preferences', {category: 'plugins', tab: 'discover'});
    } else {
      this.setState({plugin, openWithApp: null});
    }
  }

  selectEditPlugin = editPlugin => {
    this.setState({editPlugin});
  }

  selectOpenWithApp = openWithApp => {
    this.setState({plugin: 'Open With', openWithApp});
  }

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
      const fps = Number.parseInt(value, 10);
      const {originalFps} = this.state;

      if (fps < 1) {
        shake(target);
        this.setState({fps: 1});
      } else if (fps > originalFps) {
        shake(target);
        this.setState({fps: originalFps});
        ipc.callMain('update-usage', {format: this.state.format, fps: originalFps});
      } else {
        this.setState({fps});
        ipc.callMain('update-usage', {format: this.state.format, fps});
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

    ipc.callMain('export-snapshot', {
      inputPath: filePath,
      time
    });
  }

  startExport = () => {
    const {
      width,
      height,
      fps,
      openWithApp,
      filePath,
      originalFilePath,
      options,
      format,
      plugin: serviceTitle,
      originalFps,
      isNewRecording,
      editPlugin,
      original,
      recordingName
    } = this.state;
    const {startTime, endTime, isMuted, duration} = this.videoContainer.state;

    const shouldCrop = original.width !== width || original.height !== height || startTime !== 0 || endTime !== duration;

    const plugin = options.find(option => option.format === format).plugins.find(p => p.title === serviceTitle);

    const data = {
      exportOptions: {
        width,
        height,
        fps,
        startTime,
        endTime,
        isMuted,
        shouldCrop
      },
      recordingName,
      inputPath: originalFilePath || filePath,
      previewPath: filePath,
      sharePlugin: {
        ...plugin,
        serviceTitle
      },
      editPlugin,
      format,
      originalFps,
      isNewRecording,
      openWithApp
    };

    ipc.callMain('export', data);
    ipc.callMain('update-usage', {format, plugin: plugin.pluginName, fps});
  }
}
