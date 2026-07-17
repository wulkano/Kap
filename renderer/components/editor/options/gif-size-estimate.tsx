import {useEffect, useRef, useState} from 'react';
import prettyBytes from 'pretty-bytes';
import {Format} from 'common/types';
import useEditorOptions from 'hooks/editor/use-editor-options';
import useEditorWindowState from 'hooks/editor/use-editor-window-state';
import OptionsContainer from '../options-container';
import VideoControlsContainer from '../video-controls-container';
import VideoTimeContainer from '../video-time-container';

const estimateDelay = 500;

type Estimate = {
  bytes: number;
  sampleCount: number;
  sampledDuration: number;
};

const GifSizeEstimate = () => {
  const {format, width, height, fps, editPlugin} = OptionsContainer.useContainer();
  const {startTime, endTime} = VideoTimeContainer.useContainer();
  const {isMuted} = VideoControlsContainer.useContainer();
  const {filePath} = useEditorWindowState();
  const {estimateGifSize, cancelGifSizeEstimate} = useEditorOptions();

  const [estimate, setEstimate] = useState<Estimate>();
  const [isEstimating, setIsEstimating] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const canEstimate = (
      format === Format.gif &&
      !editPlugin &&
      Boolean(filePath) &&
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      Number.isFinite(fps) &&
      width > 0 &&
      height > 0 &&
      fps > 0 &&
      endTime > startTime &&
      Boolean(estimateGifSize)
    );

    if (!canEstimate) {
      requestId.current++;
      cancelGifSizeEstimate?.();
      setEstimate(undefined);
      setIsEstimating(false);
      setHasFailed(false);
      return;
    }

    const id = ++requestId.current;
    setEstimate(undefined);
    setIsEstimating(true);
    setHasFailed(false);

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
          shouldMute: isMuted
        }
      }).then(result => {
        if (id === requestId.current) {
          setEstimate(result);
          setHasFailed(!result);
        }
      }).catch(() => {
        if (id === requestId.current) {
          setEstimate(undefined);
          setHasFailed(true);
        }
      }).finally(() => {
        if (id === requestId.current) {
          setIsEstimating(false);
        }
      });
    }, estimateDelay);

    return () => {
      window.clearTimeout(timer);
      cancelGifSizeEstimate?.();
    };
  }, [cancelGifSizeEstimate, editPlugin, endTime, estimateGifSize, filePath, format, fps, height, isMuted, startTime, width]);

  if (format !== Format.gif) {
    return null;
  }

  let label = 'GIF —';
  let title = 'GIF size estimate unavailable';

  if (editPlugin) {
    title = 'GIF size estimate is unavailable while an edit plugin is enabled';
  } else if (isEstimating) {
    label = 'GIF …';
    title = 'Estimating GIF size';
  } else if (estimate) {
    label = `GIF ≈${prettyBytes(estimate.bytes)}`;
    title = estimate.sampleCount === 1 ?
      'Estimated by converting the selected clip' :
      `Estimated from ${estimate.sampleCount} samples spread across the selected clip`;
  } else if (hasFailed) {
    title = 'GIF size estimate failed';
  }

  return (
    <div className="gif-size-estimate" title={title} aria-live="polite">
      {label}
      <style jsx>{`
        .gif-size-estimate {
          color: #aaaaaa;
          flex-shrink: 0;
          font-size: 12px;
          line-height: 24px;
          margin-right: 8px;
          min-width: 88px;
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
