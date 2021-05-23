import React from 'react';
import {Subscribe} from 'unstated';

import CropperContainer from './cropper';
import CursorContainer from './cursor';
import ActionBarContainer from './action-bar';
import PreferencesContainer from './preferences';
import ConfigContainer from './config';

export const connect = (containers, mapStateToProps, mapActionsToProps) => Component => props => (
  <Subscribe to={containers}>
    {
      (...containers) => {
        const stateProps = mapStateToProps ? mapStateToProps(...containers.map(a => a.state)) : {};
        const actionProps = mapActionsToProps ? mapActionsToProps(...containers) : {};
        const componentProps = {...props, ...stateProps, ...actionProps};

        return <Component {...componentProps}/>;
      }
    }
  </Subscribe>
);

export {
  CropperContainer,
  CursorContainer,
  ActionBarContainer,
  PreferencesContainer,
  ConfigContainer
};
