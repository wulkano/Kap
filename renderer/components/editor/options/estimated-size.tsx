import {useEffect, useMemo, useState} from 'react';
import {ipcRenderer as ipc} from 'electron-better-ipc';
import {debounce} from 'lodash';
import prettyBytes from 'pretty-bytes';
import {Format} from 'common/types';
import useEditorWindowState from 'hooks/editor/use-editor-window-state';
import OptionsContainer from '../options-container';
import VideoTimeContainer from '../video-time-container';

const EstimatedSize = () => {
  const {format, width, height, fps} = OptionsContainer.useContainer();
  const {startTime, endTime} = VideoTimeContainer.useContainer();
  const {filePath} = useEditorWindowState();
  const [estimatedBytes, setEstimatedBytes] = useState<number>();
  const [isEstimating, setIsEstimating] = useState(false);

  const debouncedEstimate = useMemo(() => debounce(async (options: {filePath: string; width: number; height: number; fps: number; startTime: number; endTime: number}) => {
    setIsEstimating(true);

    try {
      const result = await ipc.callMain('estimate-gif-size', options);
      if (result) {
        setEstimatedBytes(result.estimatedBytes);
      }
    } catch {}

    setIsEstimating(false);
  }, 500), []);

  useEffect(() => () => {
    debouncedEstimate.cancel();
  }, [debouncedEstimate]);

  useEffect(() => {
    if (format !== Format.gif || !filePath || !width || !height || !fps || endTime <= startTime) {
      setEstimatedBytes(undefined);
      return;
    }

    debouncedEstimate({filePath, width, height, fps, startTime, endTime});
  }, [format, filePath, width, height, fps, startTime, endTime, debouncedEstimate]);

  if (format !== Format.gif) {
    return null;
  }

  return (
    <div className="estimated-size" title="Estimated file size of the GIF export">
      {isEstimating ? 'Estimating…' : estimatedBytes === undefined ? '' : `≈ ${prettyBytes(estimatedBytes)}`}
      <style jsx>{`
        .estimated-size {
          font-size: 12px;
          color: white;
          margin-right: 8px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default EstimatedSize;
