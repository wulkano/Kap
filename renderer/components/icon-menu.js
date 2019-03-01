import React from 'react';
import PropTypes from 'prop-types';

class IconMenu extends React.Component {
  container = React.createRef();

  openMenu = () => {
    const boundingRect = this.container.current.getBoundingClientRect();
    const {bottom, left} = boundingRect;
    const {onOpen} = this.props;

    if (onOpen) {
      onOpen({
        x: Math.round(left),
        y: Math.round(bottom)
      });
    }
  }

  render() {
    const {icon: Icon, ...iconProps} = this.props;
    return (
      <div ref={this.container}>
        <Icon {...iconProps} onClick={this.openMenu}/>
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
  onOpen: PropTypes.elementType,
  icon: PropTypes.elementType.isRequired
};

export default IconMenu;
