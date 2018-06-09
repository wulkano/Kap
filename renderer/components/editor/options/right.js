import React from 'react';
import PropTypes from 'prop-types';

import {connect, EditorContainer} from '../../../containers';
import Select from './select';

class RightOptions extends React.Component {
  render() {
    const {options, format, plugin, selectFormat, selectPlugin, formats, startExport} = this.props;

    const formatOptions = options ? formats.map(format => ({value: format, label: options[format].prettyFormat})) : [];
    const pluginOptions = options ? options[format].plugins.map(plugin => ({value: plugin.title, label: plugin.title})) : [];

    return (
      <div className="container">
        <div className="format">
          <Select options={formatOptions} selected={format} onChange={selectFormat}/>
        </div>
        <div className="plugin">
          <Select options={pluginOptions} selected={plugin} onChange={selectPlugin}/>
        </div>
        <div className="button" onClick={startExport}>Export</div>
        <style jsx>{`
          .container {
            height: 100%;
            display: flex;
            align-items: center;
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

          .button {
            padding: 4px 8px;
            background: hsla(0,0%,100%,.1);
            font-size: 12px;
            color: white;
            height: 24px;
            border-radius: 4px;
            text-align: center;
            width: 80px;
            cursor: pointer;
          }

          .button:hover {
            background: hsla(0,0%,100%,.2);
          }
        `}</style>
      </div>
    );
  }
}

RightOptions.propTypes = {
  options: PropTypes.object,
  format: PropTypes.string,
  plugin: PropTypes.string,
  selectFormat: PropTypes.func,
  selectPlugin: PropTypes.func,
  formats: PropTypes.arrayOf(PropTypes.string),
  startExport: PropTypes.func
};

export default connect(
  [EditorContainer],
  ({options, format, plugin, formats}) => ({options, format, plugin, formats}),
  ({selectFormat, selectPlugin, startExport}) => ({selectFormat, selectPlugin, startExport})
)(RightOptions);
