import React from 'react';
import PropTypes from 'prop-types';

import {DropdownArrowIcon} from '../../../vectors';

class Select extends React.Component {
  handleChange = event => {
    const {onChange} = this.props;
    onChange(event.target.value);
  }

  render() {
    const {options, selected} = this.props;
    const selectedOption = options.find(opt => opt.value === selected);
    const label = selectedOption && selectedOption.label;

    return (
      <div className="container">
        <select value={selected} onChange={this.handleChange}>
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="label">{label}</div>
        <div className="dropdown"><DropdownArrowIcon/></div>
        <style jsx>{`
          .container {
            width: 100%;
            height: 100%;
            position: relative;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            color: white;
            display: flex;
            justify-content: space-between;
          }

          .label {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          select {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            outline: none;
            color: transparent;
            box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
          }

          select:hover,
          select:focus {
            background: hsla(0, 0%, 100%, 0.2);
          }

          .dropdown {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 18px;
            pointer-events: none;
          }
        `}</style>
      </div>
    );
  }
}

Select.propTypes = {
  onChange: PropTypes.elementType,
  options: PropTypes.arrayOf(PropTypes.object),
  selected: PropTypes.any
};

export default Select;
