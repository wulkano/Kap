import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../containers';
import {SettingsIcon, PluginsIcon} from '../../vectors';

const CATEGORIES = [
  {
    name: 'general',
    icon: SettingsIcon
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
              <div
                key={name}
                className={classNames('nav-item', {active: category === name})}
                onClick={() => selectCategory(name)}
              >
                <Icon
                  size="2.4rem"
                  active={category === name}
                  hoverFill="#808080"
                />
                <span>{name}</span>
              </div>
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

          .nav-item {
            display: flex;
            align-items: center;
            margin-right: 24px;
            width: 89px;
            height: 24px;
            color: #808080;
            border-radius: 2px 2px 2px 2px;
            font-size: 12px;
            font-weight: 500;
            line-height: 16px;
            text-transform: capitalize;
            border: 1px solid transparent;
          }

          .nav-item.active {
            color: #000000;
            border-color: rgba(0, 0, 0, 0.1);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          }

          span {
            margin-left: 8px;
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
