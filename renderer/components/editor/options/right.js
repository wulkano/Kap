import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

import {connect, EditorContainer} from '../../../containers';
import Select from './select';

class RightOptions extends React.Component {
  render() {
    const {options, format, plugin, selectFormat, selectPlugin, startExport, openWithApp, selectOpenWithApp} = this.props;

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

    return (
      <div className="container">
        <div className="label">Destination</div>
        <div className="format">
          <Select options={formatOptions} selected={format} onChange={selectFormat}/>
        </div>
        <div className="plugin">
          <Select options={pluginOptions} selected={plugin} onChange={selectPlugin}/>
        </div>
        <button type="button" onClick={startExport}>Export</button>
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
            width: 80px;
            margin-right: 8px;
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
            color: white;
            height: 24px;
            border-radius: 4px;
            text-align: center;
            width: 72px;
            border: none;
            box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
          }

          button:hover,
          button:focus {
            background: hsla(0, 0%, 100%, 0.2);
            outline: none;
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
  selectOpenWithApp: PropTypes.elementType
};

export default connect(
  [EditorContainer],
  ({options, format, plugin, openWithApp}) => ({options, format, plugin, openWithApp}),
  ({selectFormat, selectPlugin, startExport, selectOpenWithApp}) => ({selectFormat, selectPlugin, startExport, selectOpenWithApp})
)(RightOptions);
