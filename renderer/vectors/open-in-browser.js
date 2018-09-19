import React from 'react';
import Svg from './svg';

const OpenInBrowserIcon = props => (
  <Svg {...props}>
    <path fill="none" d="M0 0h24v24H0V0z"/>
    <path d="M19 4H5a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h4v-2H5V8h14v10h-4v2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-7 6l-4 4h3v6h2v-6h3l-4-4z"/>
  </Svg>
);

export default OpenInBrowserIcon;
