import React from 'react';
import Svg from './svg';

const HelpIcon = props => (
  <Svg {...props}>
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 17h-2v-2h2v2zm2-7.8l-.8 1c-.8.7-1.2 1.3-1.2 2.8h-2v-.5a4 4 0 011.2-2.8l1.2-1.3c.4-.4.6-.9.6-1.4 0-1.1-.9-2-2-2s-2 .9-2 2H8a4 4 0 118 0c0 .9-.4 1.7-1 2.3z"/>
  </Svg>
);

export default HelpIcon;
