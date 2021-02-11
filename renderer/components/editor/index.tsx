import {remote} from 'electron';
import useConversionIdContext from 'hooks/editor/use-conversion-id';
import useEditorWindowState from 'hooks/editor/use-editor-window-state';
import {useEditorWindowSizeEffect} from 'hooks/editor/use-window-size';
import {useEffect, useMemo, useRef, useState} from 'react';
import EditorConversionView from './conversion';
import EditorPreview from './editor-preview';
import ReactCSSTransitionReplace from 'react-css-transition-replace';
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
    'transitioning': isTransitioning
  });

  const onTransitionEnd = () => {
    console.log('Called');
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
          transition: opacity 0.2s ease-in-out;
          opacity: 1;
        }

        .transitioning {
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default Editor;


// import PropTypes from 'prop-types';
// import React from 'react';

// import {connect, EditorContainer} from '../../containers';
// import TrafficLights from '../traffic-lights';
// import VideoPlayer from './video-player';

// class Editor extends React.Component {
//   state = {
//     hover: false
//   }

//   mouseEnter = () => {
//     this.setState({hover: true});
//   }

//   mouseLeave = () => {
//     this.setState({hover: false});
//   }

//   render() {
//     const {hover} = this.state;
//     const {title = 'Editor'} = this.props;

//     return (
//       <div className="container" onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave}>
//         <div className="title-bar">
//           <div className="title-bar-container">
//             <TrafficLights/>
//             <div className="title">{title}</div>
//           </div>
//         </div>
//         <VideoPlayer hover={hover}/>
//         <style jsx>{`
//           .container {
//             flex: 1;
//             display: flex;
//             overflow: hidden;
//           }

//           .title-bar {
//             position: absolute;
//             top: -36px;
//             left: 0;
//             width: 100%;
//             height: 36px;
//             background: rgba(0, 0, 0, 0.2);
//             backdrop-filter: blur(20px);
//             transition: top 0.12s ease-in-out;
//             display: flex;
//             z-index: 10;
//           }

//           .container:hover .title-bar {
//             top: 0;
//           }

//           .title-bar-container {
//             flex: 1;
//             height: 100%;
//             display: flex;
//             align-items: center;
//           }

//           .title {
//             width: 100%;
//             height: 100%;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             font-size: 1.4rem;
//             color: #fff;
//             margin-left: -72px;
//           }
//         `}</style>
//       </div>
//     );
//   }
// }

// Editor.propTypes = {
//   title: PropTypes.string
// };

// export default connect(
//   [EditorContainer],
//   ({title}) => ({title})
// )(Editor);
