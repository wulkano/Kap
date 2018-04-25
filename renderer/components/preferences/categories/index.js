import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

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
  componentDidUpdate(prevProps) {
    if (!prevProps.mounted && this.props.mounted) {
      // Wait for the transitions to end
      setTimeout(() => electron.ipcRenderer.send('preferences-ready'), 300);
    }
  }

  render() {
    const {category, mounted} = this.props;

    const index = CATEGORIES.findIndex(({name}) => name === category);
    const className = classNames('categories-container', {mounted});

    return (
      <div className={className}>
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
  category: PropTypes.string,
  mounted: PropTypes.bool
};

export default connect(
  [PreferencesContainer],
  ({category, mounted}) => ({category, mounted})
)(Categories);
