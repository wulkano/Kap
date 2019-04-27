import React from 'react';
import PropTypes from 'prop-types';

import Plugin from './plugin';

export const EmptyTab = ({title, subtitle, link, onClick, showIcon, image}) => {
  return (
    <div className="container">
      <div className="content">
        { showIcon && <div className="icon">📦</div> }
        <div className="title">{title}</div>
        <div className="subtitle">{subtitle}</div>
        <div className="link" onClick={onClick}>{link}</div>
      </div>
      <footer/>
      <style jsx>{`
        .container {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }

        .content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .title {
          height: 24px;
          color: var(--title-color);
          font-size: 1.6rem;
          font-weight: 500;
          margin-top: 36px;
        }

        .subtitle {
          color: #808080;
          font-size: 1.4rem;
          font-weight: normal;
          margin-bottom: 16px;
        }

        .link {
          color: var(--kap);
          font-size: 1.2rem;
          font-weight: 500;
        }

        .icon {
          font-size: 126px;
          height: 20rem;
          line-height: 20rem;
          margin-bottom: -32px;
        }

        footer {
          display: flex;
          width: 100%;
          ${image ? `background-image: url(${image});` : ''}
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center bottom;
          height: 180px;
        }
      `}</style>
    </div>
  );
};

EmptyTab.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  link: PropTypes.string,
  onClick: PropTypes.elementType.isRequired,
  showIcon: PropTypes.bool,
  image: PropTypes.string
};

const Tab = ({checked, current, plugins, disabled, onClick, onTransitionEnd, openConfig, tabIndex}) => {
  return plugins.map(plugin => {
    return (
      <Plugin
        key={plugin.name}
        tabIndex={tabIndex}
        plugin={plugin}
        disabled={disabled}
        loading={current === plugin.name}
        checked={current === plugin.name ? !checked : checked}
        openConfig={plugin.hasConfig ? (() => openConfig(plugin.name)) : undefined}
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
  onTransitionEnd: PropTypes.func,
  openConfig: PropTypes.func,
  tabIndex: PropTypes.number.isRequired
};

export default Tab;
