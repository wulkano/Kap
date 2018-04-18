// Packages
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

class Svg extends React.Component {
  onClick = () => {
    const {onClick} = this.props;
    if (onClick) {
      onClick();
    }
  }

  stopPropagation = e => {
    e.stopPropagation();
  }

  render() {
    const {fill, size, activeFill, active, onClick, children, viewBox} = this.props;

    const className = classNames({active});

    return (
      <svg
        version="1.1"
        viewBox={viewBox}
        className={className}
        onClick={onClick}
        onMouseDown={this.stopPropagation}
      >
        { children }
        <style jsx>{`
            svg {
              fill: ${fill};
              width: ${size}px;
              height: ${size}px;
            }

            svg:hover {
              fill: ${activeFill};
            }

            .active {
              fill: ${activeFill};
            }
        `}</style>
      </svg>
    );
  }
}

Svg.propTypes = {
  fill: PropTypes.string,
  size: PropTypes.number,
  activeFill: PropTypes.string,
  active: PropTypes.bool,
  children: PropTypes.any,
  viewBox: PropTypes.string,
  onClick: PropTypes.func
};

Svg.defaultProps = {
  fill: '#808080',
  activeFill: '#007aff',
  size: 24,
  active: false
};

export default Svg;
