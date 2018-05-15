import path from 'path';
import React from 'react';

const Options = ({children}) => (
  <div className="options">
    {children}
    <style jsx>{`
      .options {
        width: 100%;
        height: 48px;
        -webkit-app-region: no-drag;
      }
    `}</style>
  </div>
);

class Editor extends React.Component {
  state = {width: 768}

  render() {
    const {src} = this.props;
    return (
      <div>
        <div className="video-container">
          <div className="title-bar">kap-beta.mp4</div>
          <video
            ref={this.onRef}
            autoPlay
            loop
            muted
            onDurationChange={this.onDurationChange}
            onPlay={this.onPlay}
            preload="auto"
            src={src}
          />
        </div>

        <Options>aaaaaa</Options>

        <style jsx>{`
          video {
            width: 100% !important;
            height: auto !important;
            max.height: calc(100vh - 48px);
          }
          .video-container {
            position: relative;
            align-items: center;
            justify-content: center;
            display: flex;
            background: #111;
            flex: 1;
            border-radius: 4px 4px 0 0;
            overflow: hidden;
            height: calc(100vh - 48px);
          }
          .title-bar {
            height: 48px;
            line-height: 48px;
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

export default class extends React.Component {
  static getInitialProps() {
    const src = `file://${path.join(__dirname, '../../../../test/fixtures/kap-beta.mp4')}`;
    return {src};
  }

  render() {
    const {src} = this.props;

    return (
      <div className="root">
        <Editor src={src}/>
        <style jsx global>{`
          body {
            margin: 0;
            -webkit-app-region: drag;
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
          }
        `}</style>
      </div>
    );
  }
}
