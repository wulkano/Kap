import useConversionIdContext from 'hooks/editor/use-conversion-id';
import useEditorWindowState from 'hooks/editor/use-editor-window-state';
import {useEditorWindowSizeEffect} from 'hooks/editor/use-window-size';
import {useEffect, useState} from 'react';
import EditorConversionView from './conversion';
import EditorPreview from './editor-preview';
import classNames from 'classnames';

const Editor = () => {
  const {conversionId, setConversionId} = useConversionIdContext();
  const state = useEditorWindowState();
  const [isConversionPreviewState, setIsConversionPreviewState] = useState(false);

  useEffect(() => {
    if (state.conversionId && !conversionId) {
      setConversionId(state.conversionId);
    }
  }, [state.conversionId]);

  useEditorWindowSizeEffect(isConversionPreviewState);

  const isTransitioning = Boolean(conversionId) !== isConversionPreviewState;

  const className = classNames('container', {
    transitioning: isTransitioning
  });

  const onTransitionEnd = () => {
    setIsConversionPreviewState(Boolean(conversionId));
  };

  return (
    <div
      className={className}
      onTransitionEnd={onTransitionEnd}
    >
      {
        isConversionPreviewState ?
          <EditorConversionView conversionId={conversionId}/> :
          <EditorPreview/>
      }
      <style jsx>{`
        .container {
          flex: 1;
          display: flex;
          transition: opacity 1.4s ease-out;
          opacity: 1;
        }

        .transitioning {
          opacity: 0;
          transition: opacity 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Editor;
