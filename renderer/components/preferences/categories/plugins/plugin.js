import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

import Item from '../../item';
import Switch from '../../item/switch';
import {EditIcon, ErrorIcon} from '../../../../vectors';

const PluginTitle = ({title, label, onClick}) => (
  <div>
    <div
      className="plugin-title"
      onClick={onClick}
    >
      {title}
    </div>
    <span>{label}</span>
    <style jsx>{`
      .plugin-title {
        display: inline-block;
        color: var(--kap);
        cursor: pointer;
      }

      .plugin-title:hover {
        text-decoration: underline;
      }

      span {
        color: gray;
        padding-left: 8px;
      }
    `}</style>
  </div>
);

PluginTitle.propTypes = {
  title: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.elementType
};

const getLink = ({homepage, links}) => homepage || (links && links.homepage);

const Plugin = ({plugin, checked, disabled, onTransitionEnd, onClick, loading, openConfig, tabIndex}) => {
  const error = !plugin.isCompatible && (
    <div className="invalid" title={`This plugin is not supported by the current Kap version. Requires ${plugin.kapVersion}`}>
      <ErrorIcon fill="#ff6059" hoverFill="#ff6059" onClick={openConfig}/>
      <style jsx>{`
        .invalid {
          height: 36px;
          padding-right: 16px;
          margin-right: 16px;
          border-right: 1px solid var(--row-divider-color);
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
        }
      `}</style>
    </div>
  );

  const warning = plugin.hasConfig && !plugin.isValid && (
    <div className="invalid" title="This plugin requires configuration">
      <ErrorIcon fill="#ff6059" hoverFill="#ff6059" onClick={openConfig}/>
      <style jsx>{`
        .invalid {
          height: 36px;
          padding-right: 16px;
          margin-right: 16px;
          border-right: 1px solid var(--row-divider-color);
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
        }
      `}</style>
    </div>
  );

  return (
    <Item
      key={plugin.name}
      warning={error || warning}
      id={plugin.name}
      title={
        <PluginTitle
          title={plugin.prettyName}
          label={plugin.version}
          onClick={() => electron.shell.openExternal(getLink(plugin))}/>
      }
      subtitle={plugin.description}
    >
      {
        openConfig && plugin.isCompatible && (
          <div className="config-icon">
            <EditIcon size="18px" tabIndex={tabIndex} onClick={openConfig}/>
            <style jsx>{`
              .config-icon {
                margin-right: 16px;
                display: flex;
              }
            `}</style>
          </div>
        )
      }
      <Switch
        tabIndex={tabIndex}
        checked={checked}
        disabled={disabled || (!plugin.isCompatible && !plugin.isInstalled) || plugin.isSymlink}
        loading={loading}
        onTransitionEnd={onTransitionEnd}
        onClick={onClick}/>
    </Item>
  );
};

Plugin.propTypes = {
  plugin: PropTypes.object,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  onTransitionEnd: PropTypes.elementType,
  onClick: PropTypes.elementType,
  loading: PropTypes.bool,
  openConfig: PropTypes.func,
  tabIndex: PropTypes.number.isRequired
};

export default Plugin;
