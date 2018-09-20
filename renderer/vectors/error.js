import React from 'react';
import Svg from './svg';

const ErrorIcon = props => (
  <Svg {...props}>
    <path opacity=".3" d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
    <path d="M11 15h2v2h-2zM11 7h2v6h-2z"/>
  </Svg>
);

export default ErrorIcon;
