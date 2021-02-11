import React, {FunctionComponent} from 'react';
import Svg, {SvgProps} from './svg';

const BackPlainIcon: FunctionComponent<SvgProps> = props => (
  <Svg {...props}>
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M15.4 16.6L10.8 12l4.6-4.6L14 6l-6 6 6 6 1.4-1.4z" />
  </Svg>
);

export default BackPlainIcon;
