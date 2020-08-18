import useWindowArgs from '../hooks/window-args';
import Head from 'next/head';
import EditorPreview from '../components/editor/editor-preview';
import combineUnstatedContainers from '../utils/combine-unstated-containers';
import VideoMetadataContainer from '../components/editor/video-metadata-container';
import VideoTimeContainer from '../components/editor/video-time-container';
import VideoControlsContainer from '../components/editor/video-controls-container';
import OptionsContainer from '../components/editor/options-container';

const ContainerProvider = combineUnstatedContainers([
  OptionsContainer,
  VideoMetadataContainer,
  VideoTimeContainer,
  VideoControlsContainer
]);

const Editor = () => {
  const args = useWindowArgs();

  console.log('HERE', args);

  if (!args) {
    return null;
  }

  return (
    <div className="cover-window">
      <Head>
        <meta httpEquiv="Content-Security-Policy" content="media-src file:;"/>
      </Head>
      <ContainerProvider>
        <EditorPreview />
      </ContainerProvider>
      <style jsx global>{`
        :root {
          --slider-popup-background: rgba(255, 255, 255, 0.85);
          --slider-background-color: #ffffff;
          --slider-thumb-color: #ffffff;
          --background-color: #222222;
        }

        .dark {
          --slider-popup-background: #222222;
          --slider-background-color: var(--input-background-color);
          --slider-thumb-color: var(--storm);
        }

        .preview-hover-container:hover .video-controls {
          bottom: 0;
        }

        .preview-hover-container:not(:hover) .progress-bar-container {
          bottom: 64px;
          width: 100%
        }

        .preview-hover-container:not(:hover) .progress-bar-container .progress-bar {
          border-radius: 0;
        }

        .preview-hover-container:not(:hover) .progress-bar-container .slider {
          display: none;
        }

        .cover-window {
          -webkit-app-region: drag;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default Editor;
