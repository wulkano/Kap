import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

import {DropdownArrowIcon} from '../../../vectors';

class Select extends React.Component {
  select = React.createRef();

  handleClick = () => {
    const {options, onChange, selected} = this.props;
    if (options.length > 0) {
      const boundingRect = this.select.current.getBoundingClientRect();

      const {Menu} = electron.remote;
      const menu = Menu.buildFromTemplate(options.map(option => {
        if (option.submenu) {
          return {
            label: option.value,
            submenu: option.submenu
          };
        }

        if (option.separator) {
          return {type: 'separator'};
        }

        return {
          label: option.label,
          type: option.type || 'radio',
          checked: option.value === selected,
          click: () => onChange(option.value)
        };
      }));

      menu.popup({
        x: Math.round(boundingRect.left),
        y: Math.round(boundingRect.top)
      });
    }
  }

  render() {
    const {options, selected} = this.props;
    const selectedOption = options.find(opt => opt.value === selected);
    const label = selectedOption && selectedOption.label;

    return (
      <div ref={this.select} className="container" onClick={this.handleClick}>
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
            box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
            background: rgba(255, 255, 255, 0.1);
          }

          .label {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .container:hover,
          .container:focus {
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
