import React from 'react';
import PropTypes from 'prop-types';

import Plugin from './plugin';

export const EmptyTab = ({title, subtitle, link, onClick}) => {
  return (
    <div className="container">
      <div className="icon">📦</div>
      <div className="title">{title}</div>
      <div className="subtitle">{subtitle}</div>
      <div className="link" onClick={onClick}>{link}</div>
      <style jsx>{`
        .container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .title {
          height: 24px;
          color: #111111;
          font-size: 1.6rem;
          font-weight: 500;
        }

        .subtitle {
          color: #808080;
          font-size: 1.4rem;
          font-weight: normal;
          margin-bottom: 16px;
        }

        .link {
          color: #007AFF;
          font-size: 1.2rem;
          font-weight: 500;
        }

        .icon {
          font-size: 126px;
          height: 20rem;
          line-height: 20rem;
        }
      `}</style>
    </div>
  );
};

EmptyTab.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  link: PropTypes.string,
  onClick: PropTypes.func.isRequired
};

const Tab = ({checked, current, plugins, disabled, onClick, onTransitionEnd}) => {
  return plugins.map(plugin => {
    return (
      <Plugin
        key={plugin.name}
        plugin={plugin}
        disabled={disabled}
        loading={current === plugin.name}
        checked={current === plugin.name ? !checked : checked}
        onClick={() => onClick(plugin.name)}
        onTransitionEnd={onTransitionEnd}
      />
    );
  });
};

Tab.propTypes = {
  checked: PropTypes.bool,
  current: PropTypes.string,
  plugins: PropTypes.array,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onTransitionEnd: PropTypes.func
};

export default Tab;
