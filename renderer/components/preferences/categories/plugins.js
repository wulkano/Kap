import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../../containers';

import Item from '../item';
import Switch from '../item/switch';

import Category from './category';

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
        color: #007aff;
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
  onClick: PropTypes.func
};

class Plugins extends React.Component {
  static defaultProps = {
    installed: [],
    fromNpm: []
  }

  render() {
    const {installed, fromNpm, installing, install, uninstall, openPluginsFolder} = this.props;

    return (
      <Category>
        {
          installed.map(
            plugin => (
              <Item
                key={plugin.name}
                id={plugin.name}
                title={
                  <PluginTitle
                    title={plugin.prettyName}
                    label={plugin.version}
                    onClick={() => electron.shell.openExternal(plugin.homepage)}/>
                }
                subtitle={plugin.description}
              >
                <Switch checked disabled={Boolean(installing)} onClick={() => uninstall(plugin.name)}/>
              </Item>
            )
          )
        }
        {
          fromNpm.map(
            plugin => (
              <Item
                key={plugin.name}
                title={
                  <PluginTitle
                    title={plugin.prettyName}
                    label={plugin.version}
                    onClick={() => electron.shell.openExternal(plugin.homepage)}/>
                }
                subtitle={plugin.description}
              >
                <Switch
                  checked={installing === plugin.name}
                  loading={installing === plugin.name}
                  disabled={Boolean(installing)}
                  onClick={() => install(plugin.name)}/>
              </Item>
            )
          )
        }
        <Item title={<PluginTitle title="Open plugins folder" onClick={openPluginsFolder}/>}/>
      </Category>
    );
  }
}

Plugins.propTypes = {
  installed: PropTypes.array,
  fromNpm: PropTypes.array,
  installing: PropTypes.string,
  install: PropTypes.func.isRequired,
  uninstall: PropTypes.func.isRequired,
  openPluginsFolder: PropTypes.func.isRequired
};

export default connect(
  [PreferencesContainer],
  ({installed, fromNpm, installing}) => ({installed, fromNpm, installing}),
  ({install, uninstall, openPluginsFolder}) => ({install, uninstall, openPluginsFolder})
)(Plugins);
