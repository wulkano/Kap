import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../../../containers';
import {handleKeyboardActivation} from '../../../../utils/inputs';
import Category from '../category';
import Tab, {EmptyTab} from './tab';

class Plugins extends React.Component {
  static defaultProps = {
    pluginsInstalled: [],
    pluginsFromNpm: [],
    category: 'general'
  }

  render() {
    const {
      pluginsInstalled,
      pluginsFromNpm,
      pluginBeingInstalled,
      pluginBeingUninstalled,
      install,
      uninstall,
      onTransitionEnd,
      tab,
      selectTab,
      npmError,
      fetchFromNpm,
      openPluginsConfig,
      category
    } = this.props;

    const tabIndex = category === 'plugins' ? 0 : -1;

    return (
      <Category>
        <div className="container">
          <nav className="plugins-nav">
            <div
              tabIndex={tabIndex}
              className={tab === 'discover' ? 'selected' : ''}
              onClick={() => selectTab('discover')}
              onKeyDown={handleKeyboardActivation(() => selectTab('discover'))}
            >
              Discover
            </div>
            <div
              tabIndex={tabIndex}
              className={tab === 'installed' ? 'selected' : ''}
              onClick={() => selectTab('installed')}
              onKeyDown={handleKeyboardActivation(() => selectTab('installed'))}
            >
              Installed
            </div>
          </nav>
          <div className="tab-container">
            <div className="switcher"/>
            <div className="tab">
              {
                npmError ? (
                  <EmptyTab
                    showIcon
                    title="Oops!"
                    subtitle="Something went wrong…"
                    link="Refresh"
                    onClick={fetchFromNpm}/>
                ) : (
                  pluginsFromNpm.length === 0 ? (
                    <EmptyTab
                      title="So, you really like plugins?"
                      subtitle="You have all the plugins."
                      link="Marvel at them"
                      image="/static/all-the-things.png"
                      onClick={() => selectTab('installed')}/>
                  ) : (
                    <Tab
                      tabIndex={tabIndex === 0 && tab === 'discover' ? 0 : -1}
                      current={pluginBeingInstalled}
                      plugins={pluginsFromNpm}
                      disabled={Boolean(pluginBeingInstalled)}
                      onClick={install}/>
                  )
                )
              }
            </div>
            <div className="tab">
              {
                pluginsInstalled.length === 0 ? (
                  <EmptyTab
                    showIcon
                    title="No plugins yet"
                    subtitle="Customize Kap your liking with plugins."
                    link="Discover"
                    onClick={() => selectTab('discover')}/>
                ) : (
                  <Tab
                    checked
                    tabIndex={tabIndex === 0 && tab === 'installed' ? 0 : -1}
                    disabled={Boolean(pluginBeingInstalled)}
                    current={pluginBeingUninstalled}
                    plugins={pluginsInstalled}
                    openConfig={openPluginsConfig}
                    onClick={uninstall}
                    onTransitionEnd={onTransitionEnd}/>
                )
              }
            </div>
          </div>
        </div>
        <style jsx>{`
          .container {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
          }

          .plugins-nav {
            height: 4.8rem;
            padding: 0 16px;
            display: flex;
            align-items: center;
            box-shadow: 0 1px 0 0 var(--row-divider-color), inset 0 1px 0 0 #fff;
            z-index: 10;
          }

          .plugins-nav div {
            margin-right: 16px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-bottom: 2px;
            font-size: 1.2rem;
            color: var(--kap);
            font-weight: 500;
            width: 64px;
            outline: none;
          }

          .plugins-nav div:focus {
            border-bottom: 2px solid rgba(0, 0, 0, 0.3);
            padding-bottom: 0;
          }

          .plugins-nav .selected {
            border-bottom: 2px solid var(--kap);
            padding-bottom: 0;
          }

          .plugins-nav .selected:focus {
            border-bottom: 2px solid var(--kap);
            padding-bottom: 0;
          }

          .tab-container {
            flex: 1;
            display: flex;
            overflow-x: hidden;
          }

          .tab {
            overflow-y: auto;
            width: 100%;
            height: 100%;
            flex-shrink: 0;
          }

          .switcher {
            margin-left: ${tab === 'discover' ? 0 : -100}%;
            transition: margin 0.3s ease-in-out;
          }
        `}</style>
      </Category>
    );
  }
}

Plugins.propTypes = {
  pluginsInstalled: PropTypes.array,
  pluginsFromNpm: PropTypes.array,
  pluginBeingInstalled: PropTypes.string,
  pluginBeingUninstalled: PropTypes.string,
  install: PropTypes.elementType.isRequired,
  uninstall: PropTypes.elementType.isRequired,
  onTransitionEnd: PropTypes.elementType,
  tab: PropTypes.string,
  selectTab: PropTypes.elementType.isRequired,
  npmError: PropTypes.bool,
  fetchFromNpm: PropTypes.func.isRequired,
  openPluginsConfig: PropTypes.func.isRequired,
  category: PropTypes.string
};

export default connect(
  [PreferencesContainer],
  ({
    pluginsInstalled,
    pluginsFromNpm,
    pluginBeingInstalled,
    pluginBeingUninstalled,
    onTransitionEnd,
    tab,
    npmError,
    category
  }) => ({
    pluginsInstalled,
    pluginsFromNpm,
    pluginBeingInstalled,
    pluginBeingUninstalled,
    onTransitionEnd,
    tab,
    npmError,
    category
  }), ({
    install,
    uninstall,
    selectTab,
    fetchFromNpm,
    openPluginsConfig
  }) => ({
    install,
    uninstall,
    selectTab,
    fetchFromNpm,
    openPluginsConfig
  })
)(Plugins);
