import React from 'react';
import Svg from './svg';

const ApplicationsIcon = props => {
  const svgProps = {...props, viewBox: '0 0 24 24'};

  return (
    <Svg {...svgProps}>
      <path d="M19,4C20.11,4 21,4.9 21,6V18A2,2 0 0,1 19,20H5C3.89,20 3,19.1 3,18V6A2,2 0 0,1 5,4H19M19,18V8H5V18H19Z" />
    </Svg>
  );
};

export default ApplicationsIcon;
