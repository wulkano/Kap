import electron from 'electron';
import React from 'react';

import VideoPlayer from './video-player';

export default class Editor extends React.Component {
  state = {
    hover: false
  }

  close = () => {
    electron.remote.BrowserWindow.getFocusedWindow().close();
  }

  minimize = () => {
    electron.remote.BrowserWindow.getFocusedWindow().minimize();
  }

  maximize = () => {
    electron.remote.BrowserWindow.getFocusedWindow().maximize();
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
            <div className="traffic-lights">
              <div className="traffic-light close" onClick={this.close}/>
              <div className="traffic-light minimize" onClick={this.minimize}/>
              <div className="traffic-light maximize disabled"/>
            </div>
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
          }

          .traffic-lights {
            position: absolute;
            left: 0;
            top: 0;
            display: flex;
            align-items: center;
            height: 100%;
            margin-left: 12px;
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

          .traffic-light {
            border-radius: 100%;
            height: 12px;
            width: 12px;
            border: 1px solid rgba(0, 0, 0, 0.06);
            background-color: #ddd;
            margin-right: 8px;
            position: relative;
            -webkit-app-region: no-drag;
          }

          .traffic-light:after,
          .traffic-light:before {
            visibility: hidden;
          }

          .traffic-lights:hover .traffic-light:after,
          .traffic-lights:hover .traffic-light:before {
            visibility: visible;
          }

          .close {
            background-color: #ff6159;
          }

          .close:active {
            background-color: #bf4942;
          }

          .close:after,
          .close:before {
            background-color: #760e0e;
            width: 8px;
            height: 2px;
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: auto;
          }

          .close:after {
            transform: rotate(45deg);
          }

          .close:before {
            transform: rotate(-45deg);
          }

          .minimize {
            background-color: #ffbf2f;
          }

          .minimize:active {
            background-color: #995700;
          }

          .minimize:after {
            background-color: #760e0e;
            width: 8px;
            height: 2px;
            border-radius: 2px;
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: auto;
          }

          .disabled {
            background-color: #ddd;
            pointer-events: none;
          }

          .disabled:after,
          .disabled:before {
            display: none;
          }
        `}</style>
      </div>
    );
  }
}
