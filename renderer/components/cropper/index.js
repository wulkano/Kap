// Packages
import PropTypes from 'prop-types';
import React from 'react';

// Containers
import {connect, CropperContainer} from '../../containers';

// Components
import ActionBar from '../action-bar';
import Handles from './handles';
import Cursor from './cursor';

class Cropper extends React.Component {
  render() {
    const {startMoving, width, height, resizing} = this.props;

    return (
      <Handles>
        <div
          className="cropper"
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

Cropper.propTypes = {
  startMoving: PropTypes.func.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  resizing: PropTypes.bool
};

export default connect(
  [CropperContainer],
  ({width, height, resizing}) => ({width, height, resizing}),
  ({startMoving}) => ({startMoving})
)(Cropper);
