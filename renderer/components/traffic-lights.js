
import {remote} from 'electron';
import React from 'react';

export default () => (
  <div className="root">
    <div className="traffic-lights">
      <button type="button" className="traffic-light traffic-light-close" onClick={() => remote.app.quit()} id="close"/>
      <button type="button" className="traffic-light traffic-light-minimize" onClick={() => remote.BrowserWindow.getFocusedWindow().minimize()} id="minimize"/>
      <button type="button" disabled className="traffic-light traffic-light-maximize" onClick={() => false && remote.BrowserWindow.getFocusedWindow().maximize()} id="maximize"/>
    </div>
    <style jsx>{`
  .root {
    position: absolute;
    top: 0;
    left: 16px;
  }
  .traffic-lights {
    top: 1px;
    z-index: 100;
    left: 8px;
    -webkit-app-region: no-drag;
  }
  .traffic-lights > .traffic-light-close, .traffic-lights:hover > .traffic-light-close, .traffic-lights:active > .traffic-light-close {
    background-color: #ff6159;
  }
  .traffic-lights > .traffic-light-close:active:hover, .traffic-lights:hover > .traffic-light-close:active:hover, .traffic-lights:active > .traffic-light-close:active:hover {
    background-color: #bf4942;
  }
  .traffic-lights > .traffic-light-minimize, .traffic-lights:hover > .traffic-light-minimize, .traffic-lights:active > .traffic-light-minimize {
    background-color: #ffbd2e;
  }
  .traffic-lights > .traffic-light-minimize:active:hover, .traffic-lights:hover > .traffic-light-minimize:active:hover, .traffic-lights:active > .traffic-light-minimize:active:hover {
    background-color: #bf8e22;
  }
  .traffic-lights > .traffic-light-maximize, .traffic-lights:hover > .traffic-light-maximize, .traffic-lights:active > .traffic-light-maximize {
    // background-color: #28c941;
  }
  .traffic-lights > .traffic-light-maximize:active:hover, .traffic-lights:hover > .traffic-light-maximize:active:hover, .traffic-lights:active > .traffic-light-maximize:active:hover {
    // background-color: #1d9730;
  }
  .traffic-lights > .traffic-light:before, .traffic-lights > .traffic-light:after {
    visibility: hidden;
  }
  .traffic-lights:hover > .traffic-light:before, .traffic-lights:hover > .traffic-light:after, .traffic-lights:active > .traffic-light:before, .traffic-lights:active > .traffic-light:after {
    visibility: visible;
  }

  
  .traffic-light {
    border-radius: 100%;
    padding: 0;
    height: 12px;
    width: 12px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-sizing: border-box;
    margin-right: 7px;
    background-color: #ddd;
    position: relative;
    outline: none;
  }
  .traffic-light:before, .traffic-light:after {
    content: '';
    position: absolute;
    border-radius: 1px;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    margin: auto;
  }
  .traffic-light-close:before, .traffic-light-close:after {
    background-color: #4d0000;
    width: 8px;
    height: 2px;
  }
  .traffic-light-close:before {
    transform: rotate(45deg);
  }
  .traffic-light-close:after {
    transform: rotate(-45deg);
  }
  .traffic-light-close:active:hover:before, .traffic-light-close:active:hover:after {
    background-color: #190000;
  }
  .traffic-light-minimize:before {
    background-color: #995700;
    width: 8px;
    height: 2px;
  }
  .traffic-light-minimize:active:hover:before {
    background-color: #592800;
  }
  .traffic-light-maximize:before {
    display: none;
    background-color: #006500;
    width: 6px;
    height: 6px;
  }
  .traffic-light-maximize:after {
    display: none;
    background-color: #28c941;
    width: 10px;
    height: 2px;
    transform: rotate(45deg);
  }
  .traffic-light-maximize:active:hover:before {
    // background-color: #003200;
  }
  .traffic-light-maximize:active:hover:after {
    // background-color: #1d9730;
  }
  
  `}</style>
  </div>
);
