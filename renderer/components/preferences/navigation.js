import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../containers';
import {SettingsIcon, TuneIcon, PluginsIcon} from '../../vectors';

const CATEGORIES = [
  {
    name: 'general',
    icon: SettingsIcon
  }, {
    name: 'advanced',
    icon: TuneIcon
  }, {
    name: 'plugins',
    icon: PluginsIcon
  }
];

class PreferencesNavigation extends React.Component {
  static defaultProps = {
    category: 'general'
  }

  render() {
    const {selectCategory, category} = this.props;

    return (
      <nav className="prefs-nav">
        {
          CATEGORIES.map(
            ({name, icon: Icon}) => (
              <span key={name}>
                <Icon
                  size="2.4rem"
                  active={category === name}
                  onClick={() => selectCategory(name)}
                />
              </span>
            )
          )
        }
        <style jsx>{`
          .prefs-nav {
            height: 4.8rem;
            padding: 0 16px;
            display: flex;
            align-items: center;
          }

          span {
            margin-right: 16px;
          }
        `}</style>
      </nav>
    );
  }
}

PreferencesNavigation.propTypes = {
  category: PropTypes.string,
  selectCategory: PropTypes.func.isRequired
};

export default connect(
  [PreferencesContainer],
  ({category}) => ({category}),
  ({selectCategory}) => ({selectCategory})
)(PreferencesNavigation);
