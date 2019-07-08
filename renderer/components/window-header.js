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
            background: var(--window-header-background);
            box-shadow: var(--window-header-box-shadow);
            -webkit-app-region: drag;
            user-select: none;
            z-index: 11;
          }

          .window-header span {
            line-height: 3.6rem;
            font-size: 1.4rem;
            text-align: center;
            width: 100%;
            color: var(--subtitle-color);
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
