import TrafficLights from '../traffic-lights';
import VideoPlayer from './video-player';
import Options from './options';
import useEditorWindowState from 'hooks/editor/use-editor-window-state';

const EditorPreview = () => {
  const {title = 'Editor'} = useEditorWindowState();

  return (
    <div className="preview-container">
      <div className="preview-hover-container">
        <div className="title-bar">
          <div className="title-bar-container">
            <TrafficLights/>
            <div className="title">{title}</div>
          </div>
        </div>
        <VideoPlayer/>
      </div>
      <Options/>
      <style jsx>{`
        .preview-container {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .preview-hover-container {
          display: flex;
          flex: 1;
          flex-direction: column;
        }

        .title-bar {
          position: absolute;
          top: -36px;
          left: 0;
          width: 100%;
          height: 36px;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(20px);
          transition: top 0.12s ease-in-out;
          display: flex;
          z-index: 10;
          -webkit-app-region: drag;
        }

        .preview-hover-container .title-bar {
          top: 0;
        }

        .title-bar-container {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: center;
        }

        .title {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          color: #fff;
          margin-left: -72px;
        }
      `}</style>
    </div>
  );
};

export default EditorPreview;
