import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

const MENU_UP_THRESHOLD = 60;

class IconMenu extends React.Component {
  remote = electron.remote || false

  container = React.createRef();

  openMenu = event => {
    const boundingRect = this.container.current.getBoundingClientRect();
    const {screen} = this.remote;
    const {bottom, left, top} = boundingRect;
    const {height: screenHeight} = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
    const {onOpen} = this.props;
    event.stopPropagation();

    if (onOpen) {
      onOpen({
        x: Math.round(left),
        y: Math.round(screenHeight - bottom < MENU_UP_THRESHOLD ? top : bottom)
      });
    }
  }

  render() {
    const {children} = this.props;
    return (
      <div ref={this.container} onClick={this.openMenu}>
        {children}
        <style jsx>{`
          display: flex;
          align-items: center;
          justify-content: center;
        `}</style>
      </div>
    );
  }
}

IconMenu.propTypes = {
  onOpen: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default IconMenu;
