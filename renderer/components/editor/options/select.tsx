import {DropdownArrowIcon, CancelIcon} from '../../../vectors';
import classNames from 'classnames';
import {useRef} from 'react';
import {remote, MenuItemConstructorOptions} from 'electron';

type Option<T> = {
  label: string;
  value: T;
  subMenu?: MenuItemConstructorOptions[];
  separator?: boolean;
  type?: string;
  checked?: boolean;
}

interface Props<T> {
  value?: T;
  options: Option<T>[];
  onChange: (newValue?: T) => void;
  clearable?: boolean;
  customLabel?: string;
}

function Select<T>(props: Props<T>) {
  const select = useRef<HTMLDivElement>();
  const {options = [], value} = props;

  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = props.customLabel ?? (selectedOption?.label ?? '');
  const clearable = props.clearable && selectedOption;

  const handleClick = () => {
    if (options.length === 0) {
      return;
    }

    const boundingRect = select.current.getBoundingClientRect();

    const {Menu} = remote;

    const menu = Menu.buildFromTemplate(
      options.map(option => {
        if (option.separator) {
          return {type: 'separator'};
        }

        if (option.subMenu) {
          return {
            label: option.label,
            submenu: option.subMenu
          };
        }

        return {
          label: option.label,
          type: option.type as any || 'checkbox',
          checked: option.checked ?? (option.value === value),
          click: () => props.onChange(option.value)
        };
      })
    );

    menu.popup({
      x: Math.round(boundingRect.left),
      y: Math.round(boundingRect.top)
    });
  }

  const handleDropdownClick = event => {
    if (clearable) {
      event.stopPropagation();
      props.onChange();
    }
  };

  return (
    <div ref={select} className="container" onClick={handleClick}>
      <div className="label">{selectedLabel}</div>
      <div className={classNames({dropdown: true, clearable: clearable})} onClick={handleDropdownClick}>
        {
          clearable ?
            <CancelIcon size="16px" /> :
            <DropdownArrowIcon />
        }
      </div>
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

        .clearable {
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}

export default Select;
