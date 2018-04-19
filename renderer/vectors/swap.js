import React from 'react';
import Svg from './svg';

const SwapIcon = props => {
  const svgProps = {...props, viewBox: '0 0 24 24'};

  return (
    <Svg {...svgProps}>
      <path d="M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z"/>
    </Svg>
  );
};

export default SwapIcon;
