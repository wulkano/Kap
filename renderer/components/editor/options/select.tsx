import {DropdownArrowIcon, CancelIcon} from '../../../vectors';
import classNames from 'classnames';
import {useRef} from 'react';
import {MenuItemConstructorOptions, NativeImage} from 'electron';
import {ipcRenderer} from 'electron-better-ipc';
import {Except} from 'type-fest';

type Option<T> = {
  label: string;
  value: T;
  subMenu?: Array<Option<T>>;
  type?: string;
  checked?: boolean;
  click?: () => void;
  separator?: false;
  icon?: NativeImage | string;
};

export type Separator = {
  value: never;
  label: never;
  subMenu: never;
  type: never;
  checked: never;
  icon: never;
  separator: true;
};

interface Props<T> {
  value?: T;
  options: Array<Option<T> | Separator>;
  onChange: (newValue?: T) => void;
  clearable?: boolean;
  customLabel?: string;
}

type TransferableMenuOption = Except<MenuItemConstructorOptions, 'click'> & {
  actionId?: number;
};

// eslint-disable-next-line @typescript-eslint/comma-dangle
const Select = <T, >(props: Props<T>) => {
  const select = useRef<HTMLDivElement>();
  const {options = [], value} = props;

  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = props.customLabel ?? (selectedOption?.label);
  const clearable = props.clearable && selectedOption;

  const handleClick = async () => {
    if (options.length === 0) {
      return;
    }

    const boundingRect = select.current.getBoundingClientRect();

    let id = 1;
    const actions: Record<number, () => void> = {};

    const convertToMenuTemplate = (option: Option<T> | Separator): TransferableMenuOption => {
      if (option.separator) {
        return {type: 'separator'};
      }

      if (option.subMenu) {
        return {
          label: option.label,
          submenu: option.subMenu.map(opt => convertToMenuTemplate(opt)),
          checked: option.checked
        };
      }

      const actionId = id++;
      // @ts-expect-error
      actions[actionId] = option.click ?? (() => {
        props.onChange(option.value);
      });

      return {
        label: option.label,
        type: option.type as any || 'checkbox',
        checked: option.checked ?? (option.value === value),
        actionId,
        icon: option.icon
      };
    };

    const result = await ipcRenderer.callMain<unknown, number>('show-menu', {
      options: options.map(opt => convertToMenuTemplate(opt)),
      popup: {
        x: Math.round(boundingRect.left),
        y: Math.round(boundingRect.top)
      }
    });
    actions[result]?.();
  };

  const handleDropdownClick = event => {
    if (clearable) {
      event.stopPropagation();
      props.onChange();
    }
  };

  return (
    <div ref={select} className="container" onClick={handleClick}>
      <div className="label">{selectedLabel}</div>
      <div className={classNames({dropdown: true, clearable})} onClick={handleDropdownClick}>
        {
          clearable ?
            <CancelIcon size="16px"/> :
            <DropdownArrowIcon/>
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
};

export default Select;
