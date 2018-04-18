import React from 'react';
import Svg from './svg';

const ExitFullscreenIcon = props => {
  const svgProps = {...props, viewBox: '0 0 24 24'};

  return (
    <Svg {...svgProps}>
      <path d="M14,14H19V16H16V19H14V14M5,14H10V19H8V16H5V14M8,5H10V10H5V8H8V5M19,8V10H14V5H16V8H19Z" />
    </Svg>
  );
};

export default ExitFullscreenIcon;
