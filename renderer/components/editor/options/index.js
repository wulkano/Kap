import React from 'react';
import Size from './size';
import Fps from './fps';

const Options = () => (
  <div className="options">
    <div>
      <span className="label">Size</span>
      <Size/>
    </div>
    <div>
      <span className="label">FPS</span>
      <Fps/>
    </div>
    <div className="spacer" />
    <div>
      <span className="label">Export</span>
    </div>
    <style jsx>{`
      .spacer {
        flex: 1;
      }
      .options {
        width: 100%;
        height: 48px;
        -webkit-app-region: no-drag;
        color: white;
        -webkit-font-smoothing: antialiased;
        font-size: 12px;
        letter-spacing: -0.1px;
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      .label {
        padding: 16px;
        padding-right: 8px;
      }
    `}</style>
  </div>
);

export default Options;

