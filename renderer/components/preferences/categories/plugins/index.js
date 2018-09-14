import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../../../containers';
import Category from '../category';
import Tab, {EmptyTab} from './tab';

class Plugins extends React.Component {
  static defaultProps = {
    pluginsInstalled: [],
    pluginsFromNpm: []
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
      fetchFromNpm
    } = this.props;

    return (
      <Category>
        <div className="container">
          <nav className="plugins-nav">
            <div
              className={tab === 'discover' ? 'selected' : ''}
              onClick={() => selectTab('discover')}
            >
              Discover
            </div>
            <div
              className={tab === 'installed' ? 'selected' : ''}
              onClick={() => selectTab('installed')}
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
                    title="Oops!"
                    subtitle="Something went wrong…"
                    link="Refresh"
                    onClick={fetchFromNpm}/>
                ) : (
                  <Tab
                    current={pluginBeingInstalled}
                    plugins={pluginsFromNpm}
                    disabled={Boolean(pluginBeingInstalled)}
                    onClick={install}/>
                )
              }
            </div>
            <div className="tab">
              {
                pluginsInstalled.length === 0 ? (
                  <EmptyTab
                    title="No plugins yet"
                    subtitle="Customize Kap your liking with plugins."
                    link="Discover"
                    onClick={() => selectTab('discover')}/>
                ) : (
                  <Tab
                    checked
                    disabled={Boolean(pluginBeingInstalled)}
                    current={pluginBeingUninstalled}
                    plugins={pluginsInstalled}
                    onTransitionEnd={onTransitionEnd}
                    onClick={uninstall}/>
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
            box-shadow: 0 1px 0 0 #ddd, inset 0 1px 0 0 #fff;
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
            color: #007AFF;
            font-weight: 500;
            width: 64px;
          }

          .plugins-nav .selected {
            border-bottom: 2px solid #007aff;
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
  install: PropTypes.func.isRequired,
  uninstall: PropTypes.func.isRequired,
  onTransitionEnd: PropTypes.func,
  tab: PropTypes.string,
  selectTab: PropTypes.func.isRequired,
  npmError: PropTypes.bool,
  fetchFromNpm: PropTypes.func.isRequired
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
    npmError
  }) => ({
    pluginsInstalled,
    pluginsFromNpm,
    pluginBeingInstalled,
    pluginBeingUninstalled,
    onTransitionEnd,
    tab,
    npmError
  }), ({
    install,
    uninstall,
    selectTab,
    fetchFromNpm
  }) => ({
    install,
    uninstall,
    selectTab,
    fetchFromNpm
  })
)(Plugins);
