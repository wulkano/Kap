import React from 'react';
import Size from './size';
import Fps from './fps';
import ExportSelect from './export-select';

const TEST_OPTIONS = [{label: 'Export to disk', value: 'test'}];

const Options = () => (
  <div className="options">
    <div>
      <span className="label">Size</span>
      <Size/>
    </div>
    <div>
      <span className="label fps">FPS</span>
      <Fps/>
    </div>
    <div className="spacer"/>
    <div>
      <span className="label">Export</span>
      <ExportSelect label="GIF" options={TEST_OPTIONS}/>
      <ExportSelect label="MP4"/>
      <ExportSelect label="WebM"/>
      <ExportSelect label="APNG"/>
    </div>
    <style jsx>{`
      .spacer {
        flex: 1;
      }

      .options {
        width: 100%;
        height: 48px;
        color: white;
        -webkit-font-smoothing: antialiased;
        font-size: 12px;
        letter-spacing: -0.1px;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0 16px;
        padding-right: 8px;
        background: rgba(32,33,37,0.97);
      }

      .options > div {
        -webkit-app-region: no-drag;
      }

      .label {
        padding: 16px 8px 16px 0;
      }

      .label.fps {
        margin-left: 16px;
      }
    `}</style>
  </div>
);

export default Options;
