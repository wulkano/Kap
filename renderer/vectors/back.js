// Packages
import React from 'react';

// Components
import Svg from './svg';

const BackIcon = props => {
  const svgProps = {...props, viewBox: '0 0 24 24'};

  return (
    <Svg {...svgProps}>
      <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
    </Svg>
  );
};

export default BackIcon;
