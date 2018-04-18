// Packages
import React from 'react';
import classNames from 'classnames';
import electron from 'electron';

// Components
import MainControls from './controls/main';
import AdvancedControls from './controls/advanced';

// Contaienrs
import {connect, CropperContainer, ActionBarContainer} from '../../containers';

class ActionBar extends React.Component {
  remote = electron.remote || false

  render() {
    if(!this.remote) return null;

    const {width: screenWidth, height: screenHeight} = this.remote.getGlobal('screen');

    const {startMoving, x, y, width, height, moved, hidden, advanced, moving, startRecording, recording} = this.props;

    const className = classNames('action-bar', {moving, hidden, advanced, moved, recording});

    return (
      <div
        className={className}
        onMouseDown={startMoving}>
        <div className='actions'>
          <MainControls.Left />
          <AdvancedControls.Left />
        </div>
        <div className='record' onClick={startRecording}/>
        <div className='actions'>
          <MainControls.Right />
          <AdvancedControls.Right />
        </div>

        <style jsx>{`
            .action-bar {
              position: fixed;
              height: ${height}px;
              width: ${width}px;
              background: white;
              padding: 0 15px;
              border-radius: 4px;
              box-shadow: 0px 0px 5px 2px rgba(0,0,0,0.2);
              z-index: 10;
              top: ${y}px;
              left: ${x}px;
              display: flex;
              align-items: center;
              overflow: hidden;
              opacity: 1;
              transition: all 0.2s ease-out;
              box-sizing: border-box;
            }

            .recording {
              transition-duration: 0.4s;
              transform: scale(0.30);
              opacity: 0.1;
            }

            .moving {
              transition: none;
            }

            .hidden {
              opacity: 0;
              top: ${y + height + 10}px;
            }

            .moved.hidden {
              top: ${y}px;
            }

            .record {
              border-radius: 50%;
              background: #ff6059;
              width: 32px;
              height: 32px;
              margin: 15px;
            }

            .actions {
              flex: 1;
              display: flex;
              flex-direction: column;
              height: 100px;
              margin-top: 50px;
              transition: margin 0.25s ease-in-out;
            }

            .action-bar.advanced .actions {
              margin-top: -50px;
            }
        `}</style>
      </div>
    );
  }
}

export default connect(
  [ActionBarContainer, CropperContainer],
  ({advanced, moving, moved, width, height, x, y, recording}, {resizing, moving: cropperMoving}) => ({
    advanced, moved, width, height, x, y, moving, recording, hidden: cropperMoving || resizing
  }),
  ({startMoving, startRecording}) => ({startMoving, startRecording})
)(ActionBar);
