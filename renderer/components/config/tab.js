import React from 'react';
import PropTypes from 'prop-types';
import Linkify from 'react-linkify';

import Item, {Link} from '../preferences/item';
import Select from '../preferences/item/select';
import Switch from '../preferences/item/switch';
import ColorPicker from '../preferences/item/color-picker';
import {OpenOnGithubIcon, OpenConfigIcon} from '../../vectors';

const horizontalTypes = [
  'boolean',
  'hexColor'
];

const ConfigInput = ({name, type, schema, value, onChange, hasErrors}) => {
  if (type === 'hexColor') {
    return <ColorPicker value={value} name={name} hasErrors={hasErrors} onChange={onChange}/>;
  }

  if (type === 'select') {
    const options = schema.enum.map(value => ({label: value, value}));
    return <Select full tabIndex={0} options={options} selected={value} onSelect={value => onChange(name, value)}/>;
  }

  if (type === 'boolean') {
    return <Switch tabIndex={0} checked={value} onClick={() => onChange(name, !value)}/>;
  }

  const className = hasErrors ? 'has-errors' : '';
  const handleChange = event => {
    const value = type === 'number' ? Number.parseFloat(event.target.value) : event.currentTarget.value;
    onChange(name, value);
  };

  return (
    <div>
      <input
        className={className}
        value={value || ''}
        type={type === 'number' ? 'number' : 'text'}
        onChange={handleChange}
      />
      <style jsx>{`
        input {
          outline: none;
          width: 100%;
          border: 1px solid var(--input-border-color);
          background: var(--input-background-color);
          color: var(--title-color);
          border-radius: 3px;
          box-sizing: border-box;
          height: 32px;
          padding: 4px 8px;
          line-height: 32px;
          font-size: 12px;
          margin-top: 8px;
          outline: none;
          box-shadow: var(--input-shadow);
        }

        .has-errors {
          background: rgba(255,59,48,0.10);
          border-color: rgba(255,59,48,0.20);
        }

        input:focus {
          border-color: var(--kap);
        }

        div {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

ConfigInput.propTypes = {
  name: PropTypes.string,
  type: PropTypes.string,
  schema: PropTypes.object,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
    PropTypes.number
  ]),
  onChange: PropTypes.elementType.isRequired,
  hasErrors: PropTypes.bool
};

class Tab extends React.Component {
  render() {
    const {validator, values, onChange, openConfig, viewOnGithub, serviceTitle} = this.props;

    const {config, errors, description} = validator;
    const allErrors = errors || [];

    return (
      <div className="container">
        {
          description && (
            <div className="description">
              <Linkify component={Link}>{description}</Linkify>
            </div>
          )
        }
        {
          [...Object.keys(config)].map(key => {
            const schema = config[key];
            const type = schema.customType || (schema.enum ? 'select' : schema.type);
            const itemErrors = allErrors
              .filter(({dataPath}) => dataPath.endsWith(key))
              .map(({message}) => `This ${message}`);

            return (
              <Item
                key={key}
                small
                title={schema.title}
                subtitle={schema.description}
                vertical={!horizontalTypes.includes(type)}
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
        {
          !serviceTitle && (
            <Item subtitle="Open config file" onClick={openConfig}>
              <div className="icon-container"><OpenConfigIcon fill="var(--kap)" hoverFill="var(--kap)" onClick={openConfig}/></div>
            </Item>
          )
        }
        <Item last subtitle="View plugin on GitHub" onClick={viewOnGithub}>
          <div className="icon-container"><OpenOnGithubIcon size="20px" fill="var(--kap)" hoverFill="var(--kap)" onClick={viewOnGithub}/></div>
        </Item>
        <style jsx>{`
          .container {
            width: 100%;
            height: 100%;
            overflow-y: auto;
          }

          .description {
            color: var(--subtitle-color);
            font-weight: normal;
            font-size: 1.4rem;
            width: 100%;
            padding: 16px 16px 0 16px;
            box-sizing: border-box;
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
  validator: PropTypes.elementType,
  values: PropTypes.object,
  onChange: PropTypes.elementType.isRequired,
  openConfig: PropTypes.elementType.isRequired,
  viewOnGithub: PropTypes.elementType.isRequired,
  serviceTitle: PropTypes.string
};

export default Tab;
