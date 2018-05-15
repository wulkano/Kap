import {TouchBar} from 'electron';
import plugins from './plugins';

const {TouchBarButton, TouchBarPopover, TouchBarSpacer} = TouchBar;

const aspectRatios = [
  '16:9',
  '5:4',
  '5:3',
  '4:3',
  '3:2',
  '1:1',
  'Custom'
];

const createAspectRatioPopover = ({onChange}) => {
  const buttons = aspectRatios.map(aspectRatio => {
    return new TouchBarButton({
      label: aspectRatio,
      click: () => onChange(aspectRatio)
    });
  });

  return new TouchBarPopover({
    label: 'Aspect Ratio',
    items: new TouchBar(buttons)
  });
};

export const createMainTouchbar = ({onAspectRatioChange, onCrop}) => {
  const aspectRatioPopover = createAspectRatioPopover({onChange: onAspectRatioChange});
  const cropButton = new TouchBarButton({
    label: 'Crop',
    backgroundColor: '#7e51e5',
    click: onCrop
  });

  return new TouchBar([
    aspectRatioPopover,
    cropButton
  ]);
};

export const createRecordTouchbar = ({isRecording, isPreparing, onAspectRatioChange, onRecord}) => {
  const aspectRatioPopover = createAspectRatioPopover({onChange: onAspectRatioChange});
  const recordButton = new TouchBarButton({
    label: isPreparing ? 'Loading' : isRecording ? 'Stop' : 'Record',
    backgroundColor: '#ff5050',
    click: () => !isPreparing && onRecord(isRecording)
  });

  return new TouchBar([
    aspectRatioPopover,
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
    // TODO: When we're on Electron 1.8, we can use `nativeImage.createFromNamedImage`
    // to get the native icon for play and pause.
    // https://developer.apple.com/documentation/appkit/nsimagenametouchbarplaytemplate
    // https://developer.apple.com/documentation/appkit/nsimagenametouchbarpausetemplate
    // And for record:
    // https://developer.apple.com/documentation/appkit/nsimagenametouchbarrecordstarttemplate
    // We could also consider using the remove template for `Discard` depending on how it looks:
    // https://developer.apple.com/documentation/appkit/nsimagenametouchbarremovetemplate
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
