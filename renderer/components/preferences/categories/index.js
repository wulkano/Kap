import React from 'react';
import PropTypes from 'prop-types';
import {ipcRenderer as ipc} from 'electron-better-ipc';

import {connect, PreferencesContainer} from '../../../containers';

import General from './general';
import Plugins from './plugins';

const CATEGORIES = [
  {
    name: 'general',
    Component: General
  }, {
    name: 'plugins',
    Component: Plugins
  }
];

class Categories extends React.Component {
  componentDidUpdate(previousProps) {
    if (!previousProps.isMounted && this.props.isMounted) {
      // Wait for the transitions to end
      setTimeout(async () => ipc.callMain('preferences-ready'), 300);
    }
  }

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
              background: var(--background-color);
            }

            .switcher {
              margin-left: -${index * 100}%;
              transition: margin 0.3s ease-in-out;
            }
        `}</style>
      </div>
    );
  }
}

Categories.propTypes = {
  category: PropTypes.string,
  isMounted: PropTypes.bool
};

export default connect(
  [PreferencesContainer],
  ({category, isMounted}) => ({category, isMounted})
)(Categories);
