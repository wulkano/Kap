import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

import {connect, EditorContainer} from '../../../containers';
import Select from './select';
import {GearIcon} from '../../../vectors';

class RightOptions extends React.Component {
  render() {
    const {
      options,
      format,
      plugin,
      selectFormat,
      selectPlugin,
      startExport,
      openWithApp,
      selectOpenWithApp,
      selectEditPlugin,
      editOptions,
      editPlugin,
      openEditPluginConfig
    } = this.props;

    const formatOptions = options ? options.map(({format, prettyFormat}) => ({value: format, label: prettyFormat})) : [];
    const pluginOptions = options ? options.find(option => option.format === format).plugins.map(plugin => {
      if (plugin.apps) {
        const submenu = plugin.apps.map(app => ({
          label: app.isDefault ? `${app.name} (default)` : app.name,
          type: 'radio',
          checked: openWithApp && app.url === openWithApp.url,
          click: () => selectOpenWithApp(app),
          icon: electron.remote.nativeImage.createFromDataURL(app.icon).resize({width: 16, height: 16})
        }));

        if (plugin.apps[0].isDefault) {
          submenu.splice(1, 0, {type: 'separator'});
        }

        return {
          isBuiltIn: false,
          submenu,
          value: plugin.title,
          label: openWithApp ? openWithApp.name : ''
        };
      }

      return {
        type: openWithApp ? 'normal' : 'radio',
        value: plugin.title,
        label: plugin.title,
        isBuiltIn: plugin.pluginName.startsWith('_')
      };
    }) : [];

    if (pluginOptions.every(opt => opt.isBuiltIn)) {
      pluginOptions.push({
        separator: true
      }, {
        type: 'normal',
        label: 'Get Plugins…',
        value: 'open-plugins'
      });
    }

    const editPluginOptions = editOptions && editOptions.map(option => ({label: option.title, value: option}));
    const buttonAction = editPlugin ? openEditPluginConfig : () => selectEditPlugin(editOptions[0]);

    return (
      <div className="container">
        {
          editPluginOptions && editPluginOptions.length > 0 && (
            <>
              {
                (!editPlugin || editPlugin.hasConfig) && (
                  <button key={editPlugin} type="button" className="add-edit-plugin" onClick={buttonAction}>
                    {editPlugin ? <GearIcon fill="#fff" hoverFill="#fff" size="12px"/> : '+'}
                  </button>
                )
              }
              {
                editPlugin && (
                  <div className="edit-plugin">
                    <Select clearable options={editPluginOptions} selected={editPlugin} onChange={selectEditPlugin}/>
                  </div>
                )
              }
            </>
          )
        }
        <div className="format">
          <Select options={formatOptions} selected={format} onChange={selectFormat}/>
        </div>
        <div className="plugin">
          <Select options={pluginOptions} selected={plugin} onChange={selectPlugin}/>
        </div>
        <button type="button" className="start-export" onClick={startExport}>Export</button>
        <style jsx>{`
          .container {
            height: 100%;
            display: flex;
            align-items: center;
          }

          .label {
            font-size: 12px;
            margin-right: 8px;
            color: white;
          }

          .format {
            height: 24px;
            width: 104px;
            margin-right: 8px;
          }

          .edit-plugin {
            height: 24px;
            margin-right: 8px;
            width: 128px;
          }

          .plugin {
            height: 24px;
            width: 128px;
            margin-right: 8px;
          }

          button {
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            font-size: 12px;
            line-height: 12px;
            color: white;
            height: 24px;
            border-radius: 4px;
            text-align: center;
            border: none;
            box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
          }

          button:hover,
          button:focus {
            background: hsla(0, 0%, 100%, 0.2);
            outline: none;
          }

          .start-export {
            width: 72px;
          }

          .add-edit-plugin {
            width: max-content;
            margin-right: 8px;
          }
        `}</style>
      </div>
    );
  }
}

RightOptions.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object),
  format: PropTypes.string,
  plugin: PropTypes.string,
  selectFormat: PropTypes.elementType,
  selectPlugin: PropTypes.elementType,
  startExport: PropTypes.elementType,
  openWithApp: PropTypes.object,
  selectOpenWithApp: PropTypes.elementType,
  editPlugin: PropTypes.object,
  editOptions: PropTypes.arrayOf(PropTypes.object),
  selectEditPlugin: PropTypes.elementType,
  openEditPluginConfig: PropTypes.elementType
};

export default connect(
  [EditorContainer],
  ({options, format, plugin, openWithApp, editOptions, editPlugin}) => ({options, format, plugin, openWithApp, editOptions, editPlugin}),
  ({selectFormat, selectPlugin, startExport, selectOpenWithApp, selectEditPlugin, openEditPluginConfig}) => ({selectFormat, selectPlugin, startExport, selectOpenWithApp, selectEditPlugin, openEditPluginConfig})
)(RightOptions);
