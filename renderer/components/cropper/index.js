import PropTypes from 'prop-types';
import React from 'react';

import {connect, CropperContainer} from '../../containers';

import Handles from './handles';
import Cursor from './cursor';

class Cropper extends React.Component {
  render() {
    const {startMoving, width, height, isResizing} = this.props;

    return (
      <Handles>
        <div
          className="cropper"
          onMouseDown={startMoving}/>
        { isResizing && <Cursor width={width} height={height}/> }
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
  isResizing: PropTypes.bool
};

export default connect(
  [CropperContainer],
  ({width, height, isResizing}) => ({width, height, isResizing}),
  ({startMoving}) => ({startMoving})
)(Cropper);
