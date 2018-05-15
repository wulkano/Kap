import React from 'react';
import PropTypes from 'prop-types';

const Fps = ({width = 768, height = 432}) => (
  <React.Fragment>
    <input className="width" value={width}/>
    <input className="height" value={height}/>
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
    input:focus, input:hover {
      background-color: hsla(0,0%,100%,.2);
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

Fps.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number
};

export default Fps;
