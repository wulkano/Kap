import {ConversionStatus} from 'common/types';
import useConversion from 'hooks/editor/use-conversion';
import useConversionIdContext from 'hooks/editor/use-conversion-id';
import {useConfirmation} from 'hooks/use-confirmation';
import ConversionDetails from './conversion-details';
import TitleBar from './title-bar';
import VideoPreview from './video-preview';

const dialogOptions = {
  message: 'Are you sure you want to discard this conversion?',
  detail: 'Any progress will be lost.',
  confirmButtonText: 'Discard'
};

const EditorConversionView = ({conversionId}: {conversionId: string}) => {
  const {setConversionId} = useConversionIdContext();
  const conversion = useConversion(conversionId);

  const cancel = () => {
    conversion.cancel();
  };

  const safeCancel = useConfirmation(cancel, dialogOptions);

  const cancelAndGoBack = () => {
    cancel();
    setConversionId('');
  };

  const inProgress = conversion.state?.status === ConversionStatus.inProgress;

  const finalCancel = inProgress ? safeCancel : cancel;

  return (
    <div className="editor-conversion-view">
      <TitleBar
        conversion={conversion.state} cancel={cancelAndGoBack} copy={() => {
          conversion.copy();
        }}/>
      <VideoPreview conversion={conversion.state} cancel={finalCancel}/>
      <ConversionDetails conversion={conversion.state}/>
      <style jsx>{`
        .editor-conversion-view {
          display: flex;
          flex-direction: column;
          flex: 1;
          -webkit-app-region: no-drag;
        }
      `}</style>
    </div>
  );
};

export default EditorConversionView;
