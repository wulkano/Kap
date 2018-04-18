// Packages
import React from 'react';

// Components
import Handles from './handles';
import Cursor from './cursor';
import ActionBar from '../action-bar';

// Containers
import {connect, CropperContainer} from '../../containers';

class Cropper extends React.Component {
  render() {
    const {startMoving, width, height, resizing} = this.props;

    return (
      <Handles>
        <div
          className='cropper'
          onMouseDown={startMoving}/>
        <ActionBar/>
        { resizing && <Cursor width={width} height={height}/> }
        <style jsx>{`
          .cropper {
            flex: 1;
            z-index: 6;
          }
        `}</style>
      </Handles>
    );
  }
}

export default connect(
  [CropperContainer],
  ({width, height, resizing}) => ({width, height, resizing}),
  ({startMoving}) => ({startMoving})
)(Cropper);
