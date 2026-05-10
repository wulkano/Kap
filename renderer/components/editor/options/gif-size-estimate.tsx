import {useEffect, useRef, useState} from 'react';
import {Format} from 'common/types';
import useEditorOptions from 'hooks/editor/use-editor-options';
import useEditorWindowState from 'hooks/editor/use-editor-window-state';
import OptionsContainer from '../options-container';
import VideoTimeContainer from '../video-time-container';

const estimateDelay = 500;

const GifSizeEstimate = () => {
  const {format, width, height, fps} = OptionsContainer.useContainer();
  const {startTime, endTime} = VideoTimeContainer.useContainer();
  const {filePath} = useEditorWindowState();
  const {estimateGifSize} = useEditorOptions();

  const [size, setSize] = useState<string>();
  const [isEstimating, setIsEstimating] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const canEstimate = (
      format === Format.gif &&
      filePath &&
      width &&
      height &&
      fps &&
      endTime > startTime &&
      estimateGifSize
    );

    if (!canEstimate) {
      requestId.current++;
      setSize(undefined);
      setIsEstimating(false);
      return;
    }

    const id = ++requestId.current;
    setSize(undefined);
    setIsEstimating(true);

    const timer = window.setTimeout(() => {
      estimateGifSize({
        filePath,
        conversionOptions: {
          width,
          height,
          startTime,
          endTime,
          fps,
          shouldCrop: true,
          shouldMute: true
        }
      }).then(estimatedSize => {
        if (id === requestId.current) {
          setSize(estimatedSize);
        }
      }).catch(() => {
        if (id === requestId.current) {
          setSize(undefined);
        }
      }).finally(() => {
        if (id === requestId.current) {
          setIsEstimating(false);
        }
      });
    }, estimateDelay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [endTime, estimateGifSize, filePath, format, fps, height, startTime, width]);

  if (format !== Format.gif) {
    return null;
  }

  const label = size ? `GIF ~${size}` : (isEstimating ? 'GIF ...' : 'GIF N/A');

  return (
    <div className="gif-size-estimate" title="Estimated GIF size">
      {label}
      <style jsx>{`
        .gif-size-estimate {
          color: #aaaaaa;
          flex-shrink: 0;
          font-size: 12px;
          line-height: 24px;
          margin-right: 8px;
          min-width: 80px;
          overflow: hidden;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default GifSizeEstimate;
