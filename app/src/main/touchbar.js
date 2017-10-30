import {TouchBar} from 'electron';
import plugins from './plugins';

const {TouchBarButton, TouchBarPopover} = TouchBar;

const aspectRatioToSize = {
  '16:9': '1600x900',
  '5:4': '1280x1024',
  '5:3': '1280x768',
  '4:3': '1024x768',
  '3:2': '480x320',
  '1:1': '512x512',
  Custom: 'Custom'
};

const createAspectRatioPopover = ({onChange}) => {
  const buttons = [
    '16:9',
    '5:4',
    '5:3',
    '4:3',
    '3:2',
    '1:1',
    'Custom'
  ].map(aspectRatio => {
    return new TouchBarButton({
      label: aspectRatio,
      click: () => onChange(aspectRatioToSize(aspectRatio))
    });
  });

  return new TouchBarPopover({
    label: 'Aspect Ratio',
    items: new TouchBar(buttons)
  });
};

const createSizePopover = ({onChange}) => {
  const sizeButtons = [
    '1600x900',
    '1280x1024',
    '1280x768',
    '1024x768',
    '480x320',
    '512x512',
    'Custom'
  ].map(size => {
    return new TouchBarButton({
      label: size,
      click: () => onChange(size)
    });
  });

  return new TouchBarPopover({
    label: 'Size',
    items: new TouchBar(sizeButtons)
  });
};

export const createMainTouchbar = ({onSizeChange, onCrop}) => {
  const aspectRatioPopover = createAspectRatioPopover({onChange: onSizeChange});
  const sizePopover = createSizePopover({onChange: onSizeChange});
  const cropButton = new TouchBarButton({
    label: 'Crop',
    backgroundColor: '#7e51e5',
    click: onCrop
  });

  return new TouchBar([
    aspectRatioPopover,
    sizePopover,
    cropButton
  ]);
};

export const createCropTouchbar = ({onSizeChange, onRecord}) => {
  const aspectRatioPopover = createAspectRatioPopover({onChange: onSizeChange});
  const sizePopover = createSizePopover({onChange: onSizeChange});
  const recordButton = new TouchBarButton({
    label: 'Record',
    backgroundColor: '#ff5050',
    click: onRecord
  });

  return new TouchBar([
    aspectRatioPopover,
    sizePopover,
    recordButton
  ]);
};

const shareServices = {};

plugins.getShareServices().forEach(service => {
  service.formats.forEach(format => {
    shareServices[format] = shareServices[format] || [];
    shareServices[format].push(service);
  });
});

const createFormatPopover = ({format, services, onSelectPlugin}) => {
  const serviceButtons = services.map(service => {
    return new TouchBarButton({
      label: service.title,
      click: () => onSelectPlugin(service.pluginName, format)
    });
  });

  return new TouchBarPopover({
    label: format.toUpperCase(),
    items: new TouchBar(serviceButtons)
  });
};

export const createEditorTouchbar = ({onSelectPlugin}) => {
  const formatPopovers = Object.keys(shareServices).map(format => {
    return createFormatPopover({
      format,
      services: shareServices[format],
      onSelectPlugin
    });
  });

  return new TouchBar(formatPopovers);
};
