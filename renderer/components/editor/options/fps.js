import React from 'react';

export default () => <React.Fragment>
  <button className="first active">15</button>
  <button className="middle">30</button>
  <button className="last">60</button>
  <style jsx>{`
    button {
      appearance: none;
      border: none;
      height: 24px;
      color: #FFF;
      padding: 4px 16px;
      font-size: 12px;
      border: 1px solid rgba(255,255,255,.10);
      background: transparent;
      transition: border .12s ease-in-out,background .12s ease-in-out;
    }
    button:focus {
      outline: none;
    }
    button:not(.active):hover {
      background-color: #5d5d5d;
      border-color: #5d5d5d;
    }
    .active {
      background-color: #6f6f6f;
      border-color: #6f6f6f;
    }
    .first {
      border-radius: 4px 0px 0px 4px;
    }
    .middle {
      border-left: none;
      border-right: none;
    }
    .last {
      border-radius: 0px 4px 4px 0px;
    }
  `}</style>
</React.Fragment>;