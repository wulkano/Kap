import React from 'react';
import PropTypes from 'prop-types';

import Item from '../preferences/item';
import Select from '../preferences/item/select';
import Switch from '../preferences/item/switch';
import {OpenOnGithubIcon, OpenConfigIcon} from '../../vectors';

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
            border: 1px solid #ddd;
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
            border-color: rgba(255,59,48,0.20);
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
        <Item subtitle="Open config file" onClick={openConfig}>
          <div className="icon-container"><OpenConfigIcon fill="#007aff" hoverFill="#007aff" onClick={openConfig}/></div>
        </Item>
        <Item last subtitle="View plugin on GitHub" onClick={viewOnGithub}>
          <div className="icon-container"><OpenOnGithubIcon size="20px" fill="#007aff" hoverFill="#007aff" onClick={viewOnGithub}/></div>
        </Item>
        <style jsx>{`
          .container {
            width: 100%;
            height: 100%;
            overflow-y: auto;
          }

          .icon-container {
            width: 24px;
            height: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
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
