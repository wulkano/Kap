import React from 'react';
import PropTypes from 'prop-types';

class IconMenu extends React.Component {
  container = React.createRef();

  openMenu = () => {
    const boundingRect = this.container.current.children[0].getBoundingClientRect();
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
      <div ref={this.container} onClick={this.openMenu}>
        <Icon {...iconProps}/>
        <style jsx>{`
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${this.props.fillParent ? '100%' : 'none'};
          height: ${this.props.fillParent ? '100%' : 'none'}
        `}</style>
      </div>
    );
  }
}

IconMenu.propTypes = {
  onOpen: PropTypes.elementType,
  icon: PropTypes.elementType.isRequired,
  fillParent: PropTypes.bool
};

export default IconMenu;
