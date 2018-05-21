import React from 'react';
import PropTypes from 'prop-types';

const Size = ({width = 768, height = 432}) => (
  <React.Fragment>
    <input className="width" size="5" value={width}/>
    <input className="height" size="5" value={height}/>
    <style jsx>{`
    input {
      appearance: none;
      background-color: rgba(255, 255, 255, 0.10);
      border: none;
      height: 24px;
      color: #fff;
      padding: 4px 8px;
      font-size: 12px;
      transition: border .12s ease-in-out,background .12s ease-in-out;
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

Size.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number
};

export default Size;
