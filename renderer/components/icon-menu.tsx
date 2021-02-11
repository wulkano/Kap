import React, {FunctionComponent, useRef} from 'react';
import {SvgProps} from 'vectors/svg';

interface IconMenuProps extends SvgProps {
  onOpen: (options: {x: number, y: number}) => void,
  icon: FunctionComponent<SvgProps>,
  fillParent?: boolean
}

const IconMenu: FunctionComponent<IconMenuProps> = ({onOpen, icon: Icon, fillParent, ...iconProps}) => {
  const container = useRef(null);

  const openMenu = () => {
    const boundingRect = container.current.children[0].getBoundingClientRect();
    const {bottom, left} = boundingRect;

    onOpen({
      x: Math.round(left),
      y: Math.round(bottom)
    });
  }

  return (
    <div ref={container} onClick={openMenu}>
      <Icon {...iconProps} />
      <style jsx>{`
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${fillParent ? '100%' : 'none'};
          height: ${fillParent ? '100%' : 'none'}
        `}</style>
    </div>
  )
}

export default IconMenu;
