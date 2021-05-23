import {CancelIcon, SpinnerIcon} from 'vectors';
import {UseConversion, UseConversionState} from 'hooks/editor/use-conversion';
import {ExportStatus} from 'common/types';
import useEditorWindowState from 'hooks/editor/use-editor-window-state';
import useConversionIdContext from 'hooks/editor/use-conversion-id';

const VideoPreview = ({conversion, cancel, showInFolder}: {conversion: UseConversionState; cancel: () => any; showInFolder: () => any}) => {
  const {conversionId} = useConversionIdContext();
  const {filePath} = useEditorWindowState();
  const src = `file://${filePath}`;

  const percentage = conversion?.progress ?? 0;
  const done = conversion?.status !== ExportStatus.inProgress;

  const onDragStart = (event: any) => {
    event.preventDefault();
    // Has to be the electron one for this
    const {ipcRenderer} = require('electron');
    ipcRenderer.send('drag-export', conversionId);
  };

  return (
    <div draggable className="video-preview" onDragStart={onDragStart} onClick={showInFolder}>
      {
        done && conversion?.canPreviewExport ?
          <img src={`file://${conversion?.filePath}`}/> :
          <video src={src}/>
      }
      <div className="overlay" style={{display: done ? 'none' : 'flex'}}>
        <div className="progress-indicator">
          {
            percentage === 0 ?
              <IndeterminateSpinner/> :
              <ProgressCircle percent={percentage}/>
          }
        </div>
        <div className="cancel" title="Cancel" onClick={cancel}>
          <CancelIcon fill="white" hoverFill="white" activeFill="white" size="100%"/>
        </div>
      </div>
      <style jsx>{`
        .video-preview {
          width: 100%;
          height: wrap-content;
          background: black;
          position: relative;
          flex: 1;
          height: 0;
          -webkit-app-region: no-drag;
        }

        video, img {
          width: 100%;
          height: 100%;
        }

        .overlay {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background .35s ease-in-out;
        }

        .overlay:hover {
          background: rgba(0, 0, 0, .5);
        }

        .progress-indicator, .cancel {
          width: 48px;
          height: 48px;
          position: absolute;
          transition: opacity 0.35s ease-in-out;
        }

        .cancel {
          width: 24px;
          height: 24px;
          pointer-events: none;
          opacity: 0;
        }

        .overlay:hover .cancel {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
};

const IndeterminateSpinner = () => (
  <div className="container">
    <SpinnerIcon stroke="#fff"/>
    <style jsx>{`
          .container {
            width: 100%;
            height: 100%;
            animation: spin 3s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }

            50% {
              transform: rotate(720deg);
            }

            100% {
              transform: rotate(1080deg);
            }
          }
        `}</style>
  </div>
);

const ProgressCircle = ({percent}: {percent: number}) => {
  const circumference = 12 * 2 * Math.PI;
  const offset = circumference * (1 - percent);

  return (
    <svg viewBox="0 0 24 24">
      <circle stroke="white" strokeWidth="2" fill="transparent" cx="12" cy="12" r="12"/>
      <style jsx>{`
          svg {
            width: 100%;
            height: 100%;
            overflow: visible;
            transform: rotate(-90deg);
          }

          circle {
            stroke-dasharray: ${circumference} ${circumference};
            stroke-dashoffset: ${offset};
            ${percent === 0 ? '' : 'transition: stroke-dashoffset 0.35s;'}
          }
        `}</style>
    </svg>
  );
};

export default VideoPreview;
