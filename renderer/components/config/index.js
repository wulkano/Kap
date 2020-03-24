import React from 'react';
import PropTypes from 'prop-types';

import {connect, ConfigContainer} from '../../containers';
import Tab from './tab';

class Config extends React.Component {
  render() {
    const {
      validators,
      values,
      onChange,
      selectedTab,
      selectTab,
      closeWindow,
      openConfig,
      viewOnGithub,
      serviceTitle
    } = this.props;

    if (!validators) {
      return null;
    }

    return (
      <div className="container">
        {
          validators.length > 1 && (
            <nav className="service-nav">
              {
                validators.map((validator, index) => {
                  return (
                    <div
                      key={validator.title}
                      className={selectedTab === index ? 'selected' : ''}
                      onClick={() => selectTab(index)}
                    >
                      {validator.title}
                    </div>
                  );
                })
              }
            </nav>
          )
        }
        <div className="tab-container">
          <div className="switcher"/>
          {
            validators.map(validator => {
              return (
                <div key={validator.title} className="tab">
                  <Tab
                    validator={validator}
                    values={values}
                    openConfig={openConfig}
                    viewOnGithub={viewOnGithub}
                    serviceTitle={serviceTitle}
                    onChange={onChange}
                  />
                </div>
              );
            })
          }
        </div>
        <footer>
          <div className="fade"/>
          <button type="button" onClick={closeWindow}>Done</button>
        </footer>
        <style jsx>{`
          .container {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            word-break: break-word;
          }

          .service-nav {
            height: 3.6rem;
            padding: 0 16px;
            display: flex;
            align-items: center;
            box-shadow: 0 1px 0 0 var(--row-divider-color), inset 0 1px 0 0 #fff;
            z-index: 10;
            max-width: 100%;
            overflow-x: auto;
          }

          .service-nav div {
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
          }

          .service-nav div:last-child {
            margin-right: 0;
          }

          .service-nav .selected {
            border-bottom: 2px solid var(--kap);
            padding-bottom: 0;
          }

          .tab-container {
            flex: 1;
            display: flex;
            overflow-x: hidden;
            height: 272px;
          }

          .tab {
            overflow-y: auto;
            width: 100%;
            height: 100%;
            flex-shrink: 0;
          }

          .switcher {
            margin-left: ${-selectedTab * 100}%;
            transition: margin 0.3s ease-in-out;
          }

          footer {
            width: 100%;
            display: flex;
            position: relative;
          }

          footer .fade {
            position: absolute;
            background: linear-gradient(-180deg, rgba(255,255,255,0) 0%, var(--background-color) 100%);
            width: 100%;
            height: 16px;
            top: 0;
            transform: translateY(-100%);
          }

          footer button {
            height: 32px;
            line-height: 16px;
            margin: 0 16px 16px 16px;
            background: var(--button-color);
            border-radius: 3px;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            outline: none;
            border: none;
          }
        `}</style>
      </div>
    );
  }
}

Config.propTypes = {
  validators: PropTypes.arrayOf(PropTypes.elementType),
  values: PropTypes.object,
  onChange: PropTypes.elementType.isRequired,
  selectedTab: PropTypes.number,
  selectTab: PropTypes.elementType.isRequired,
  closeWindow: PropTypes.elementType.isRequired,
  openConfig: PropTypes.elementType.isRequired,
  viewOnGithub: PropTypes.elementType.isRequired,
  serviceTitle: PropTypes.string
};

export default connect(
  [ConfigContainer],
  ({validators, values, selectedTab, serviceTitle}) => ({validators, values, selectedTab, serviceTitle}),
  ({onChange, selectTab, closeWindow, openConfig, viewOnGithub}) => ({onChange, selectTab, closeWindow, openConfig, viewOnGithub})
)(Config);
