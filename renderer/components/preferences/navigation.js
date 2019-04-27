import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../containers';
import {SettingsIcon, PluginsIcon} from '../../vectors';

import {handleKeyboardActivation} from '../../utils/inputs';

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
                tabIndex={0}
                className={classNames('nav-item', {active: category === name})}
                onClick={() => selectCategory(name)}
                onKeyDown={handleKeyboardActivation(() => selectCategory(name))}
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
            color: var(--subtitle-color);
            border-radius: 2px;
            font-size: 12px;
            font-weight: 500;
            line-height: 16px;
            text-transform: capitalize;
            border: 1px solid transparent;
            outline: none;
          }

          .nav-item.active {
            color: var(--title-color);
            border-color: var(--navigation-item-border-color);
            box-shadow: var(--navigation-item-box-shadow);
            background: var(--navigation-item-background);
          }

          .nav-item:focus {
            border-color: var(--navigation-item-border-color);
            box-shadow: var(--navigation-item-box-shadow);
            background: var(--navigation-item-background);
          }

          .nav-item.active:focus {
            border-color: rgba(0, 0, 0, 0.2);
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
  selectCategory: PropTypes.elementType.isRequired
};

export default connect(
  [PreferencesContainer],
  ({category}) => ({category}),
  ({selectCategory}) => ({selectCategory})
)(PreferencesNavigation);
