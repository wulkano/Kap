import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

class Svg extends React.Component {
  static defaultProps = {
    fill: '#808080',
    activeFill: '#007aff',
    hoverFill: '#606060',
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
    const {
      fill,
      size,
      activeFill,
      hoverFill,
      active,
      onClick,
      children,
      viewBox,
      shadow
    } = this.props;

    const className = classNames({active, shadow});

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
              fill: ${hoverFill};
            }
            
            .shadow {
              filter: drop-shadow(0 1px 2px rgba(0,0,0,.1));
            }

            .active, .active:hover {
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
  hoverFill: PropTypes.string,
  active: PropTypes.bool,
  children: PropTypes.any,
  viewBox: PropTypes.string,
  onClick: PropTypes.func,
  shadow: PropTypes.bool
};

export default Svg;
