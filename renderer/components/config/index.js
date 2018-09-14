import React from 'react';

import {connect, ConfigContainer} from '../../containers';

import Item from '../preferences/item';
import Button from '../preferences/item/button';

class Config extends React.Component {
  render() {
    const {validators, values} = this.props;
    if (!validators) return null;
    const [validator] = validators;
    const { config } = validator;

    return (
      <div className="container">
        {
          [...Object.keys(config)].map(property => {
            return (
              <Item title={property} subtitle={values[property]}>
                <Button title="Choose"/>
              </Item>
            );
          })
        }
        <style jsx>{`
        `}</style>
      </div>
    );
  }
}

Config.propTypes = {

};

export default connect(
  [ConfigContainer],
  ({validators, values}) => ({validators, values})
)(Config);
