// Packages
import {Subscribe} from 'unstated';

// Containers
import CropperContainer from './cropper';
import CursorContainer from './cursor';
import ActionBarContainer from './action-bar';

export const connect = (containers, mapStateToProps, mapActionsToProps) => Component => props => (
  <Subscribe to={containers}>
    {
      (...containers) => {
        const stateProps = mapStateToProps ? mapStateToProps(...containers.map(a => a.state)) : {};
        const actionProps = mapActionsToProps ? mapActionsToProps(...containers) : {};
        const componentProps = {...props, ...stateProps, ...actionProps};

        return <Component {...componentProps} />
      }
    }
  </Subscribe>
);


export {
  CropperContainer,
  CursorContainer,
  ActionBarContainer
};
