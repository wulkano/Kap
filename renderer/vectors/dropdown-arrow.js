import React from 'react';
import Svg from './svg';

const DropdownArrowIcon = props => {
  const svgProps = {...props, viewBox: '0 0 24 24'};

  return (
    <Svg {...svgProps}>
      <path d="M7,10L12,15L17,10H7Z" />
    </Svg>
  );
};

export default DropdownArrowIcon;
