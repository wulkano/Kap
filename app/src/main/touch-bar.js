import {TouchBar} from 'electron';
import plugins from './plugins';

const {TouchBarButton, TouchBarPopover, TouchBarSpacer} = TouchBar;

const aspectRatioToSize = new Map([
  ['16:9', '1600x900'],
  ['5:4', '1280x1024'],
  ['5:3', '1280x768'],
  ['4:3', '1024x768'],
  ['3:2', '480x320'],
  ['1:1', '512x512'],
  ['Custom', 'Custom']
]);

const createAspectRatioPopover = ({onChange}) => {
  const buttons = [...aspectRatioToSize.keys()].map(aspectRatio => {
    return new TouchBarButton({
      label: aspectRatio,
      click: () => onChange(aspectRatioToSize.get(aspectRatio))
    });
  });

  return new TouchBarPopover({
    label: 'Aspect Ratio',
    items: new TouchBar(buttons)
  });
};

const createSizePopover = ({onChange}) => {
  const sizeButtons = [...aspectRatioToSize.values()].map(size => {
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

const createFormatPopover = ({format, services, onSelectPlugin}) => {
  const serviceButtons = services.map(service => {
    return new TouchBarButton({
      label: service.title,
      click: () => onSelectPlugin(service.pluginName, format)
    });
  });

  return new TouchBarPopover({
    label: plugins.prettifyFormat(format),
    items: new TouchBar(serviceButtons)
  });
};

export const createEditorTouchbar = ({isPlaying, onDiscard, onSelectPlugin, onTogglePlay}) => {
  const shareServices = plugins.getShareServicesPerFormat();
  const controlButton = new TouchBarButton({
    label: isPlaying ? 'Pause' : 'Play',
    click: () => onTogglePlay(!isPlaying)
  });
  const discardButton = new TouchBarButton({
    label: 'Discard',
    backgroundColor: '#ff5050',
    click: onDiscard
  });
  const formatPopovers = Object.keys(shareServices).map(format => {
    return createFormatPopover({
      format,
      services: shareServices[format],
      onSelectPlugin
    });
  });

  return new TouchBar([
    controlButton,
    new TouchBarSpacer({size: 'small'}),
    ...formatPopovers,
    new TouchBarSpacer({size: 'flexible'}),
    discardButton
  ]);
};
