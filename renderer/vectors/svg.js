import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

class Svg extends React.Component {
  static defaultProps = {
    fill: '#808080',
    activeFill: '#007aff',
    size: '24px',
    active: false,
    viewBox: '0 0 24 24'
  }

  onClick = () => {
    const {onClick} = this.props;
    if (onClick) {
      onClick();
    }
  }

  stopPropagation = event => {
    event.stopPropagation();
  }

  render() {
    const {fill, size, activeFill, active, onClick, children, viewBox} = this.props;

    const className = classNames({active});

    return (
      <svg
        viewBox={viewBox}
        className={className}
        onClick={onClick}
        onMouseDown={this.stopPropagation}
      >
        { children }
        <style jsx>{`
            svg {
              fill: ${fill};
              width: ${size};
              height: ${size};
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
  size: PropTypes.string,
  activeFill: PropTypes.string,
  active: PropTypes.bool,
  children: PropTypes.any,
  viewBox: PropTypes.string,
  onClick: PropTypes.func
};

export default Svg;
