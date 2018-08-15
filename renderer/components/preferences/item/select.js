import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import {DropdownArrowIcon} from '../../../vectors';

class Select extends React.Component {
  static defaultProps = {
    options: []
  }

  constructor(props) {
    super(props);
    this.select = React.createRef();
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

  handleClick = () => {
    const boundingRect = this.select.current.getBoundingClientRect();

    this.state.menu.popup({
      x: Math.round(boundingRect.left),
      y: Math.round(boundingRect.top)
    });
  }

  render() {
    const {options, selected} = this.props;

    const selectedLabel = options.length === 0 ? 'No input devices' : (
      selected ? options.find(option => option.value === selected).label : 'Select Device'
    );

    return (
      <div
        ref={this.select}
        className="select"
        onClick={this.handleClick}
      >
        <span>{selectedLabel}</span>
        <div className="dropdown">
          <DropdownArrowIcon size="15px"/>
        </div>
        <style jsx>{`
          .select {
            border: 1px solid #ddd;
            border-radius: 4px;
            height: 2.4rem;
            transition: border 0.12s ease-in-out;
            display: flex;
            align-items: center;
            padding-right: 32px;
            user-select: none;
            line-height: 2.4rem;
            position: relative;
          }

          .select span {
            flex: 1;
            text-align: right;
            padding-right: 5px;
            padding: 0 12px;
          }

          .select:hover {
            border-color: #ccc;
          }

          .dropdown {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            right: 8px;
            pointer-events: none;
            display: flex;
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
