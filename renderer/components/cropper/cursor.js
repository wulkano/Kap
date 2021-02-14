import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import {connect, CursorContainer, CropperContainer} from '../../containers';

class Cursor extends React.Component {
  remote = electron.remote || false;

  render() {
    if (!this.remote) {
      return null;
    }

    const {
      cursorY,
      cursorX,
      width,
      height,
      screenWidth,
      screenHeight
    } = this.props;

    const className = classNames('dimensions', {
      flipY: screenHeight - cursorY < 35,
      flipX: screenWidth - cursorX < 40
    });

    return (
      <div className={className}>
        <div>{width}</div>
        <div>{height}</div>
        <style jsx>{`
          .dimensions {
            position: fixed;
            top: ${cursorY}px;
            left: ${cursorX}px;
            padding: 10px;
          }

          .dimensions.flipX {
            left: auto;
            right: ${screenWidth - cursorX}px;
          }

          .dimensions.flipY {
            top: auto;
            bottom: ${screenHeight - cursorY}px;
          }

          .dimensions div {
            font-size: 0.6rem;
            text-shadow: 1px 1px 0 #fff
          }
        `}</style>
      </div>
    );
  }
}

Cursor.propTypes = {
  cursorX: PropTypes.number,
  cursorY: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  screenWidth: PropTypes.number,
  screenHeight: PropTypes.number
};

export default connect(
  [CursorContainer, CropperContainer],
  ({cursorX, cursorY}, {screenWidth, screenHeight}) => ({cursorX, cursorY, screenWidth, screenHeight})
)(Cursor);
