import React from 'react';
import PropTypes from 'prop-types';

const Chevron = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="5" viewBox="0 0 10 5" className="c-select__toggle-icon" style={{marginLeft: '8px'}}>
    <g fill="none" fillRule="evenodd" transform="translate(-7 -10)">
      <polygon fill="#8C8C8C" points="7 10 12 15 17 10"/>
      <polygon points="0 0 24 0 24 24 0 24"/>
    </g>
  </svg>
);

const Select = ({options}) => (
  <select>
    {options.map(option => <option key={option.value}>{option.label}</option>)}
    <style jsx>{`
    select {
      position: absolute;
      height: 100%;
      width: 100%;
      opacity: 0;
    }
  `}</style>
  </select>
);

Select.propTypes = {
  options: PropTypes.array.isRequired
};

const ExportSelect = ({options = [], label}) => {
  const hasOptions = options && options.length !== 0;
  return (
    <div className="root">
      {hasOptions && <Select options={options}/>}
      <button type="button"><span className="label">{label}</span>{hasOptions && <Chevron/>}</button>
      <style jsx>{`
        .root {
          display: inline-block;
          position: relative;
          margin-right: 8px;
        }
        button {
          appearance: none;
          background-color: rgba(255,255,255,.10);
          border: none;
          border-radius: 4px;
          color: #FFF;
          font-size: 12px;
          height: 24px;
          padding: 0 8px;
          transition: border .12s ease-in-out,background .12s ease-in-out;
          display: flex;
          align-items: center;
          flex-direction: row;
        }
        button:focus {
          outline: none;
        }
        button:focus, button:hover {
          background-color: hsla(0,0%,100%,.2);
        }
      `}</style>
    </div>
  );
};

ExportSelect.propTypes = {
  options: PropTypes.array,
  label: PropTypes.string.isRequired
};

export default ExportSelect;

