import React, {FunctionComponent} from 'react';
import classNames from 'classnames';

import {handleKeyboardActivation} from '../utils/inputs';

const defaultProps: SvgProps = {
  fill: 'var(--icon-color)',
  activeFill: 'var(--kap)',
  hoverFill: 'var(--icon-hover-color)',
  size: '24px',
  active: false,
  viewBox: '0 0 24 24',
  tabIndex: -1
};

const stopPropagation = event => {
  event.stopPropagation();
};

const Svg: FunctionComponent<SvgProps> = props => {
  const {
    fill,
    size,
    activeFill,
    hoverFill,
    active,
    onClick,
    children,
    viewBox,
    shadow,
    tabIndex,
    isMenu
  } = {
    ...defaultProps,
    ...props
  };

  const className = classNames({active, shadow, focusable: tabIndex >= 0});

  return (
    <div tabIndex={tabIndex} onKeyDown={tabIndex >= 0 ? handleKeyboardActivation(onClick, {isMenu}) : undefined}>
      <svg
        viewBox={viewBox}
        className={className}
        onClick={onClick}
        onMouseDown={stopPropagation}
      >
        {children}
      </svg>
      <style jsx>{`
            svg {
              fill: ${fill};
              width: ${size};
              height: ${size};
            }

            svg:hover,
            div:focus svg {
              fill: ${hoverFill};
            }

            div {
              position: relative;
              width: ${size};
              height: ${size};
              outline: none;
            }

            div.focusable:focus::before {
              content: '';
              position: absolute;
              left: 0;
              right: 0;
              width: 100%;
              height: 100%;
              transform: scale(${1 / 0.75});
              background: var(--icon-focus-background-color);
              z-index: -1;
              border-radius: 2px;
            }

            .shadow {
              filter: drop-shadow(0 1px 2px rgba(0,0,0,.1));
            }

            .active,
            .active:hover,
            div.focusable:focus svg {
              fill: ${activeFill};
            }
        `}</style>
    </div>
  );
};

export interface SvgProps {
  fill?: string;
  size?: string;
  activeFill?: string;
  hoverFill?: string;
  active?: boolean;
  viewBox?: string;
  onClick?: () => void;
  shadow?: boolean;
  tabIndex?: number;
  isMenu?: boolean;
}

export default Svg;
