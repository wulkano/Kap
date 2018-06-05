import React from 'react';
import PropTypes from 'prop-types';

import TrafficLights from '../traffic-lights';
import Options from './options';
import Video from './video';

export default class Editor extends React.Component {
  static propTypes = {
    src: PropTypes.string.isRequired
  }

  render() {
    const {src} = this.props;
    return (
      <div>
        <div className="video-container">
          <div className="title-bar">
            <TrafficLights/>
            <span className="title-bar__title">kap-beta.mp4</span>
          </div>
          <Video src={src}/>
        </div>

        <Options/>

        <style jsx>{`
          .video-container {
            position: relative;
            align-items: center;
            justify-content: center;
            display: flex;
            background: #111;
            flex: 1;
            border-radius: 5px 5px 0 0;
            overflow: hidden;
            height: calc(100vh - 48px);
          }

          .title-bar {
            height: 36px;
            line-height: 36px;
            font-weight: 100;
            font-size: 13px;
            text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
            background: rgba(0, 0, 0, 0.4);
            color: white;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            transform: translateY(-100%);
            transition: opacity 100ms ease, transform 500ms linear;
            opacity: 0;
            text-align: center;
          }

          .video-container:hover .title-bar {
            transform: translateY(0);
            transition: transform 100ms ease;
            opacity: 1;
          }

          .root {
            display: flex;
            height: 100vh;
            width: 100vw;
            flex-direction: column;
          }
        `}</style>
      </div>
    );
  }
}
