import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../../containers';

import General from './general';
import Advanced from './advanced';
import Plugins from './plugins';

const CATEGORIES = [
  {
    name: 'general',
    Component: General
  }, {
    name: 'advanced',
    Component: Advanced
  }, {
    name: 'plugins',
    Component: Plugins
  }
];

class Categories extends React.Component {
  render() {
    const {category} = this.props;

    const index = CATEGORIES.findIndex(({name}) => name === category);

    return (
      <div className="categories-container">
        <div className="switcher"/>
        {
          CATEGORIES.map(
            ({name, Component}) => (
              <Component key={name}/>
            )
          )
        }
        <style jsx>{`
            .categories-container {
              flex: 1;
              display: flex;
              overflow-x: hidden;
            }

            .switcher {
              margin-left: -${index * 100}%;
              transition: margin 0.3s ease;
            }
        `}</style>
      </div>
    );
  }
}

Categories.propTypes = {
  category: PropTypes.string
};

export default connect(
  [PreferencesContainer],
  ({category}) => ({category})
)(Categories);
