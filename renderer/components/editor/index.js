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
    // TODO: When we get to Electron 4 use this API https://github.com/electron/electron/commit/a42ca9eecc6e82c087604f92a3e6581de66ece5a
    const win = electron.remote.BrowserWindow.getFocusedWindow();
    win.setFullScreen(!win.isFullScreen());
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
              <div className="traffic-light close" onClick={this.close}>
                <svg width="12" height="12">
                  <circle cx="6" cy="6" r="5.75" strokeWidth="0.5"/>
                  <line x1="3.17" y1="3.17" x2="8.83" y2="8.83" stroke="black"/>
                  <line x1="3.17" y1="8.83" x2="8.83" y2="3.17" stroke="#760e0e"/>
                </svg>
              </div>
              <div className="traffic-light minimize" onClick={this.minimize}>
                <svg width="12" height="12">
                  <circle cx="6" cy="6" r="5.75" strokeWidth="0.5"/>
                  <line x1="2" y1="6" x2="10" y2="6"/>
                </svg>
              </div>
              <div className="traffic-light maximize" onClick={this.maximize}>
                <svg width="12" height="12">
                  <circle cx="6" cy="6" r="5.75" strokeWidth="0.5"/>
                  <rect x="3.5" y="3.5" width="5" height="5" rx="1" ry="1"/>
                  <rect className="background-rect" x="5.5" y="1.5" width="1" height="9" transform="rotate(-45 6 6)"/>
                </svg>
              </div>
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
            height: 100%;
            display: flex;
            align-items: center;
          }

          .traffic-lights {
            display: flex;
            align-items: center;
            height: max-content;
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
            background-color: #ddd;
            margin-right: 8px;
            position: relative;
            -webkit-app-region: no-drag;
          }

          .traffic-light line,
          .traffic-light rect {
            visibility: hidden;
          }

          .traffic-lights:hover line,
          .traffic-lights:hover rect {
            visibility: visible;
          }

          .close line {
            stroke: #580300;
          }

          .close circle {
            stroke: #E24640;
            fill: #ff6155;
          }

          .close:active circle {
            fill: #c1483f;
            stroke: #c1483f;
          }

          .close:active line {
            stroke: #1e0101;
          }

          .minimize line {
            stroke: #a66400;
          }

          .minimize circle {
            stroke: #DFA023;
            fill: #ffc008;
          }

          .minimize:active circle {
            fill: #c0910a;
            stroke: #c0910a;
          }

          .minimize:active line {
            stroke: #5a2800;
          }

          .maximize rect {
            fill: #006500;
            stroke: #006500;
          }

          .maximize:active rect {
            fill: #003200;
            stroke: #003200;
          }

          .maximize circle {
            stroke: #1BAC2C;
            fill: #16d137;
          }

          .maximize .background-rect {
            stroke: #16d137;
            fill: #16d137;
          }

          .maximize:active circle,
          .maximize:active .background-rect {
            fill: #119b29;
            stroke: #119b29;
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
