import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import {VolumeHighIcon, VolumeOffIcon, FullscreenIcon} from '../../../vectors';
import {connect, VideoContainer, EditorContainer} from '../../../containers';

class RightControls extends React.Component {
  fullscreen = () => {
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    electron.remote.BrowserWindow.getFocusedWindow().setBounds({x: 0, y: 0, width, height});
  }

  render() {
    const {isMuted, mute, unmute, format} = this.props;
    const canUnmute = !['gif', 'apng'].includes(format);

    return (
      <div className="container">
        <div className="mute">
          {
            isMuted ?
              <VolumeOffIcon fill="#fff" hoverFill="#fff" onClick={canUnmute ? unmute : undefined}/> :
              <VolumeHighIcon fill="#fff" hoverFill="#fff" onClick={mute}/>
          }
        </div>
        <div className="fullscreen">
          <FullscreenIcon fill="#fff" hoverFill="#fff" onClick={this.fullscreen}/>
        </div>
        <style jsx>{`
            .container {
              display: flex;
              width: 100%;
              align-items: center;
              padding: 0 16px;
              justify-content: flex-end;
            }

            .mute,
            .fullscreen {
              width: 24px;
              height: 24px;
              margin-left: 16px;
            }
        `}</style>
      </div>
    );
  }
}

RightControls.propTypes = {
  isMuted: PropTypes.bool,
  mute: PropTypes.func,
  unmute: PropTypes.func,
  format: PropTypes.string
};

export default connect(
  [VideoContainer, EditorContainer],
  ({isMuted}, {format}) => ({isMuted, format}),
  ({mute, unmute}) => ({mute, unmute})
)(RightControls);
