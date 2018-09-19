import React from 'react';
import Svg from './svg';

const OpenFolderIcon = props => (
  <Svg {...props}>
    <path fill="none" d="M0 0h24v24H0V0z"/>
    <path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 12H4V8h16v10z"/>
  </Svg>
);

export default OpenFolderIcon;
