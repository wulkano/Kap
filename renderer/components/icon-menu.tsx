import {MenuItemConstructorOptions} from 'electron';
import React, {FunctionComponent, useRef} from 'react';
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
      const {api} = require('electron-util');
      const menu = api.Menu.buildFromTemplate(props.template);
      menu.popup({
        x: Math.round(left),
        y: Math.round(bottom)
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
