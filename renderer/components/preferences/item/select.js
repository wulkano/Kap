import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import {DropdownArrowIcon} from '../../../vectors';

class Select extends React.Component {
  static defaultProps = {
    options: []
  }

  state = {}

  static getDerivedStateFromProps(nextProps) {
    const {options, onSelect, selected} = nextProps;

    if (!electron.remote || options.length === 0) {
      return {};
    }

    const {Menu, MenuItem} = electron.remote;
    const menu = new Menu();

    for (const option of options) {
      menu.append(
        new MenuItem({
          label: option.label,
          type: 'radio',
          checked: option.value === selected,
          click: () => onSelect(option.value)
        })
      );
    }

    return {menu};
  }

  render() {
    const {menu} = this.state;
    const {options, selected} = this.props;

    const selectedLabel = options.length === 0 ? 'No input devices' : (
      selected ? options.find(option => option.value === selected).label : 'Select Device'
    );

    return (
      <div className="select" onClick={() => menu.popup()}>
        <span>{selectedLabel}</span>
        <DropdownArrowIcon size="15px"/>
        <style jsx>{`
          .select {
            border: 1px solid #ddd;
            border-radius: 4px;
            height: 1.1rem;
            transition: border 0.12s ease-in-out;
            display: flex;
            align-items: center;
            padding: 5px;
            user-select: none;
          }

          .select span {
            flex: 1;
            text-align: right;
            padding-right: 5px;
          }

          .select:hover {
            border-color: #ccc;
          }
        `}</style>
      </div>
    );
  }
}

Select.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.any
  })),
  onSelect: PropTypes.func.isRequired,
  selected: PropTypes.string
};

export default Select;
