import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const ColorPicker = ({hasErrors, value, onChange}) => {
  const className = classNames('container', {'has-errors': hasErrors});
  const handleChange = event => {
    const value = event.currentTarget.value.toUpperCase();
    onChange(value.startsWith('#') ? value : `#${value}`);
  };

  return (
    <div className={className}>
      <div className="preview">
        <input
          type="color"
          value={value}
          onChange={handleChange}/>
      </div>
      <input
        type="text"
        value={value.startsWith('#') ? value.slice(1, value.length) : value}
        size={7}
        onChange={handleChange}
        onMouseUp={event => {
          event.currentTarget.select();
        }}
      />
      <style jsx>{`
        .container {
          display: flex;
          align-items: center;
          border: 1px solid var(--input-border-color);
          background: var(--input-background-color);
          transition: border 0.12s ease-in-out;
          height: 2.4rem;
          padding: 0 0.8rem;
          border-radius: 4px;
          color: var(--title-color);
          font-size: 1.2rem;
          text-align: center;
          line-height: 2.4rem;
          outline: none;
        }

        .has-errors {
          border-color: rgba(255,59,48,0.20);
        }

        .container:hover {
          border-color: var(--input-hover-border-color);
        }
  
        .container:focus {
          border-color: var(--kap);
        }

        .preview {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          background-color: ${value};
          margin-right: 8px;
          position: relative;
        }

        input[type="text"] {
          outline: none;
          border: none;
          background: transparent;
          color: var(--title-color);
          font-size: 1.2rem;
        }

        input[type="color"] {
          opacity: 0;
          z-index: 2;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

ColorPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.elementType,
  hasErrors: PropTypes.bool
};

export default ColorPicker;
