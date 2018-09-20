import React from 'react';
import PropTypes from 'prop-types';

import Item from '../preferences/item';
import Select from '../preferences/item/select';
import Switch from '../preferences/item/switch';
import {OpenInBrowserIcon, OpenFolderIcon} from '../../vectors';

const ConfigInput = ({name, type, schema, value, onChange, hasErrors}) => {
  if (type === 'string') {
    const className = hasErrors ? 'has-errors' : '';
    return (
      <div>
        <input className={className} value={value || ''} onChange={e => onChange(name, e.target.value || undefined)}/>
        <style jsx>{`
          input {
            outline: none;
            width: 100%;
            border: 1px solid ${hasErrors ? 'rgba(255,59,48,0.20)' : '#ddd'};
            border-radius: 3px;
            box-sizing: border-box;
            height: 32px;
            padding: 4px 8px;
            line-height: 32px;
            font-size: 12px;
            margin-top: 16px;
          }

          .has-errors {
            background: rgba(255,59,48,0.10);
          }

          div {
            width: 100%;
          }
        `}</style>
      </div>
    );
  }

  if (type === 'select') {
    const options = schema.enum.map(value => ({label: value, value}));
    return <Select options={options} selected={value} onSelect={value => onChange(name, value)}/>;
  }

  return <Switch checked={value} onClick={() => onChange(name, !value)}/>;
};

ConfigInput.propTypes = {
  name: PropTypes.string,
  type: PropTypes.string,
  schema: PropTypes.object,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  onChange: PropTypes.func.isRequired,
  hasErrors: PropTypes.bool
};

class Tab extends React.Component {
  render() {
    const {validator, values, onChange, openConfig, viewOnGithub} = this.props;

    const {config, errors} = validator;
    const allErrors = errors || [];

    return (
      <div className="container">
        {
          [...Object.keys(config)].map(key => {
            const schema = config[key];
            const type = schema.enum ? 'select' : schema.type;
            const itemErrors = allErrors
              .filter(({dataPath}) => dataPath.endsWith(key))
              .map(({message}) => `This ${message}`);

            return (
              <Item
                key={key}
                title={schema.title}
                subtitle={schema.description}
                vertical={type === 'string'}
                errors={itemErrors}
              >
                <ConfigInput
                  hasErrors={itemErrors.length > 0}
                  name={key}
                  type={type}
                  schema={schema}
                  value={values[key]}
                  onChange={onChange}
                />
              </Item>
            );
          })
        }
        <Item subtitle="Open file" onClick={openConfig}>
          <OpenFolderIcon fill="#007aff" hoverFill="#007aff" onClick={openConfig}/>
        </Item>
        <Item subtitle="View on GitHub" onClick={viewOnGithub}>
          <OpenInBrowserIcon fill="#007aff" hoverFill="#007aff" onClick={viewOnGithub}/>
        </Item>
        <style jsx>{`
          .container {
            width: 100%;
            height: 100%;
            overflow-y: auto;
          }
        `}</style>
      </div>
    );
  }
}

Tab.propTypes = {
  validator: PropTypes.func,
  values: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  openConfig: PropTypes.func.isRequired,
  viewOnGithub: PropTypes.func.isRequired
};

export default Tab;
