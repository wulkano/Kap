import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import Video from './video';
import LeftControls from './controls/left';
import RightControls from './controls/right';
import PlayBar from './controls/play-bar';

export default class VideoPlayer extends React.Component {
  render() {
    const {hover} = this.props;

    const className = classNames('video-controls', {hover});

    return (
      <div className="container">
        <Video/>
        <div className={className}>
          <div className="controls left"><LeftControls/></div>
          <div className="controls center"><PlayBar hover={hover}/></div>
          <div className="controls right"><RightControls/></div>
        </div>
        <style jsx>{`
          .container {
            flex: 1;
            display: flex;
            position: relative;
          }

          .video-controls {
            position: absolute;
            width: 100%;
            height: 64px;
            bottom: ${hover ? 0 : -64}px;
            left: 0;
            background-image: linear-gradient(-180deg,transparent,rgba(0, 0, 0, 0.2));
            padding: 16px 0;
            display: flex;
            align-items: center;
            transition: bottom 0.12s ease-in-out;
            -webkit-app-region: no-drag;
          }

          .left,
          .right {
            width: 20%;
          }

          .center {
            width: 60%;
            align-items: center;
          }

          .controls {
            height: 100%;
            display: flex;
          }
        `}</style>
      </div>
    );
  }
}

VideoPlayer.propTypes = {
  hover: PropTypes.bool
};
