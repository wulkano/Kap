import React from 'react';
import PropTypes from 'prop-types';

import {connect, EditorContainer} from '../../../containers';
import Select from './select';

class RightOptions extends React.Component {
  render() {
    const {options, format, plugin, selectFormat, selectPlugin, startExport} = this.props;

    const formatOptions = options ? options.map(({format, prettyFormat}) => ({value: format, label: prettyFormat})) : [];
    const pluginOptions = options ? options.find(option => option.format === format).plugins.map(plugin => ({value: plugin.title, label: plugin.title})) : [];

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
            background: hsla(0, 0%, 100%, 0.1);
            font-size: 12px;
            color: white;
            height: 24px;
            border-radius: 4px;
            text-align: center;
            width: 72px;
            border: none;
          }

          button:hover, button:focus {
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
  selectFormat: PropTypes.func,
  selectPlugin: PropTypes.func,
  startExport: PropTypes.func
};

export default connect(
  [EditorContainer],
  ({options, format, plugin}) => ({options, format, plugin}),
  ({selectFormat, selectPlugin, startExport}) => ({selectFormat, selectPlugin, startExport})
)(RightOptions);
