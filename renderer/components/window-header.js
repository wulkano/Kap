import React from 'react';
import PropTypes from 'prop-types';

class WindowHeader extends React.Component {
  render() {
    return (
      <header className="window-header">
        <span>{this.props.title}</span>
        {this.props.children}
        <style jsx>{`
          .window-header {
            min-height: 3.6rem;
            position: relative;
            display: flex;
            flex-direction: column;
            background-color: #f9f9f9;
            background-image: linear-gradient(-180deg, #f9f9f9 0%, #f1f1f1 100%);
            box-shadow: 0 1px 0 0 #ddd, inset 0 1px 0 0 #fff;
            -webkit-app-region: drag;
            user-select: none;
            z-index: 1;
          }

          .window-header span {
            line-height: 3.6rem;
            font-size: 1.4rem;
            text-align: center;
            width: 100%;
          }
        `}</style>
      </header>
    );
  }
}

WindowHeader.propTypes = {
  title: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default WindowHeader;
