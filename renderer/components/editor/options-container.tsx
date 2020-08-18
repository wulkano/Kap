import {useState, useEffect} from 'react'
import {createContainer} from 'unstated-next';

import {FormatName, EditService} from '../../../main/common/remote-state';
import useWindowArgs from '../../hooks/window-args';
import VideoMetadataContainer from './video-metadata-container';
import VideoControlsContainer from './video-controls-container';
import useEditorOptions from './editor-options';


const isFormatMuted = (format: FormatName) => ['gif', 'apng'].includes(format);

const useOptions = () => {
  const {fps: originalFps} = useWindowArgs();
  const {
    state: {
      formats,
      fpsHistory,
      editServices
    },
    updateFpsUsage,
    isLoading
  } = useEditorOptions();

  const metadata = VideoMetadataContainer.useContainer();
  const {isMuted, mute, unmute} = VideoControlsContainer.useContainer();

  const [format, setFormat] = useState<FormatName>();
  const [fps, setFps] = useState<number>();
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  const [editPlugin, setEditPlugin] = useState<EditService>();

  const [wasMuted, setWasMuted] = useState(false);

  const updateFps = (newFps: number, formatName = format) => {
    updateFpsUsage({format: formatName, fps: newFps});
    setFps(newFps);
  }

  const updateFormat = (formatName: FormatName) => {
    if (metadata.hasAudio) {
      if (isFormatMuted(formatName) && !isFormatMuted(format)) {
        setWasMuted(isMuted);
        mute();
      } else if (!isFormatMuted(formatName) && isFormatMuted(format) && !wasMuted) {
        unmute();
      }
    }

    setFormat(formatName);
    updateFps(Math.min(originalFps, fpsHistory[formatName]), formatName);
  }

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const formatName = formats[0].format

    setFormat(formatName);
    updateFps(Math.min(originalFps, fpsHistory[formatName]), formatName);
  }, [isLoading]);

  useEffect(() => {
    setWidth(metadata.width);
    setHeight(metadata.height);
  }, [metadata]);

  useEffect(() => {
    if (!editPlugin) {
      return;
    }

    const newPlugin = editServices.find(service => service.pluginName === editPlugin.pluginName && service.title === editPlugin.title);
    setEditPlugin(newPlugin);
  }, [editServices]);

  const setDimensions = (dimensions: {width: number, height: number}) => {
    setWidth(dimensions.width);
    setHeight(dimensions.height);
  }

  const res = {
    width,
    height,
    format,
    fps,
    originalFps,
    editPlugin,
    formats,
    editServices,
    updateFps,
    updateFormat,
    setEditPlugin,
    setDimensions
  };

  console.log(res);
  return res;
}

const OptionsContainer = createContainer(useOptions);

export default OptionsContainer;
