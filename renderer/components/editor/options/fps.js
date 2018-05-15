import React from 'react';

export default () => (
  <React.Fragment>
    <input className="width"/>
    <input className="height"/>
    <style jsx>{`
    input {
      appearance: none;
      background-color: rgba(255,255,255,.10);
      border: none;
      height: 24px;
      color: #FFF;
      padding: 4px 8px;
      font-size: 12px;
      width: 64px; // TODO: fix autosizing inputs?
    }
    input:focus {
      outline: none;
    }
    .width {
      border-radius: 4px 0px 0px 4px;
      margin-right: 1px;
    }
    .height {
      border-radius: 0px 4px 4px 0px;
    }
  `}</style>
  </React.Fragment>
);
