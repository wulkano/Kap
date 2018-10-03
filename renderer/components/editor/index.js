import React from 'react';

import TrafficLights from '../traffic-lights';
import VideoPlayer from './video-player';

export default class Editor extends React.Component {
  state = {
    hover: false
  }

  mouseEnter = () => {
    this.setState({hover: true});
  }

  mouseLeave = () => {
    this.setState({hover: false});
  }

  render() {
    const {hover} = this.state;

    return (
      <div className="container" onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave}>
        <div className="title-bar">
          <div className="title-bar-container">
            <TrafficLights/>
            <div className="title">Editor</div>
          </div>
        </div>
        <VideoPlayer hover={hover}/>
        <style jsx>{`
          .container {
            flex: 1;
            display: flex;
            overflow: hidden;
          }

          .title-bar {
            position: absolute;
            top: -36px;
            left: 0;
            width: 100%;
            height: 36px;
            background: rgba(0, 0, 0, 0.4);
            transition: top 0.12s ease-in-out;
            display: flex;
            z-index: 10;
          }

          .container:hover .title-bar {
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
          }
        `}</style>
      </div>
    );
  }
}
