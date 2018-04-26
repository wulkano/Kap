import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';
import css from 'styled-jsx/css';

import {
  MoreIcon,
  CropIcon,
  ApplicationsIcon,
  FullscreenIcon,
  ExitFullscreenIcon
} from '../../../vectors';

import {connect, ActionBarContainer, CropperContainer} from '../../../containers';

const mainStyle = css`
  .main {
    height: 64px;
    display: flex;
    flex: 1;
    align-items: center;
  }
`;

const MainControls = {};

const remote = electron.remote || false;
let menu;

const buildMenu = async ({appSelected, selectApp}) => {
  const {buildWindowsMenu, activateApp} = remote.require('./common/windows');

  const onSelect = win => {
    activateApp(win);
    selectApp(win);
  };

  menu = await buildWindowsMenu(onSelect, appSelected);
};

class Left extends React.Component {
  state = {};

  static getDerivedStateFromProps(nextProps, prevState) {
    const {appSelected, selectApp} = nextProps;

    if (appSelected !== prevState.appSelected) {
      buildMenu({appSelected, selectApp});
      return {appSelected};
    }

    return null;
  }

  render() {
    const {toggleAdvanced, appSelected} = this.props;

    return (
      <div className="main">
        <div className="crop">
          <CropIcon size="22px" onClick={toggleAdvanced}/>
        </div>
        <ApplicationsIcon active={Boolean(appSelected)} onClick={() => menu.popup()}/>
        <style jsx>{mainStyle}</style>
        <style jsx>{`
          .crop {
            margin-left: 32px;
            margin-right: 64px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </div>
    );
  }
}

Left.propTypes = {
  toggleAdvanced: PropTypes.func.isRequired,
  selectApp: PropTypes.func.isRequired,
  appSelected: PropTypes.string
};

MainControls.Left = connect(
  [CropperContainer, ActionBarContainer],
  ({appSelected}) => ({appSelected}),
  ({selectApp}, {toggleAdvanced}) => ({selectApp, toggleAdvanced})
)(Left);

class Right extends React.Component {
  render() {
    const {enterFullscreen, exitFullscreen, fullscreen} = this.props;

    return (
      <div className="main">
        <div className="fullscreen">
          {
            fullscreen ?
              <ExitFullscreenIcon onClick={exitFullscreen}/> :
              <FullscreenIcon onClick={enterFullscreen}/>
          }
        </div>
        <MoreIcon onClick={() => electron.remote.require('./menus').moreMenu.popup()}/>
        <style jsx>{mainStyle}</style>
        <style jsx>{`
          .fullscreen {
            margin-left: 56px;
            margin-right: 64px;
            height: 24px;
          }
        `}</style>
      </div>
    );
  }
}

Right.propTypes = {
  enterFullscreen: PropTypes.func.isRequired,
  exitFullscreen: PropTypes.func.isRequired,
  fullscreen: PropTypes.bool
};

MainControls.Right = connect(
  [CropperContainer],
  ({fullscreen}) => ({fullscreen}),
  ({enterFullscreen, exitFullscreen}) => ({enterFullscreen, exitFullscreen})
)(Right);

export default MainControls;
