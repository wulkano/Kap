import {MenuItemConstructorOptions} from 'electron';
import { ipcRenderer } from 'electron-better-ipc';
import React, {FunctionComponent, useRef} from 'react';
import { Except } from 'type-fest';
import {SvgProps} from 'vectors/svg';

type MenuProps = {
  onOpen: (options: {x: number; y: number}) => void;
} | {
  template: MenuItemConstructorOptions[];
};

type IconMenuProps = SvgProps & MenuProps & {
  icon: FunctionComponent<SvgProps>;
  fillParent?: boolean;
};

type TransferableMenuOption = Except<MenuItemConstructorOptions, 'click'> & {
  actionId?: number;
};

const IconMenu: FunctionComponent<IconMenuProps> = props => {
  const {icon: Icon, fillParent, ...iconProps} = props;
  const container = useRef(null);

  const openMenu = () => {
    const boundingRect = container.current.children[0].getBoundingClientRect();
    const {bottom, left} = boundingRect;

    if ('onOpen' in props) {
      props.onOpen({
        x: Math.round(left),
        y: Math.round(bottom)
      });
    } else {
      let id = 1;
      const actions: Record<number, () => void> = {};

      const convertToMenuTemplate = (option: MenuItemConstructorOptions): TransferableMenuOption => {

        if (option.submenu) {
          return {
            ...option,
            submenu: Array.isArray(option.submenu) ? option.submenu.map(opt => convertToMenuTemplate(opt)) : undefined,
          };
        }

        const { click, ...rest } = option;
        const actionId = id++;
        // @ts-expect-error
        actions[actionId] = option.click;

        return {
          ...rest,
          actionId,
        };
      };

      ipcRenderer.callMain<unknown, number>('show-menu', {
        options: props.template.map(opt => convertToMenuTemplate(opt)),
        popup: {
          x: Math.round(left),
          y: Math.round(bottom)
        }
      }).then(result => {
        if (result) {
          actions[result]?.();
        }
      });
    }
  };

  return (
    <div ref={container} onClick={openMenu}>
      <Icon {...iconProps}/>
      <style jsx>{`
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${fillParent ? '100%' : 'none'};
          height: ${fillParent ? '100%' : 'none'}
        `}</style>
    </div>
  );
};

export default IconMenu;
