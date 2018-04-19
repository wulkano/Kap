import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';
import css from 'styled-jsx/css';

import {
  LinkIcon,
  CropIcon,
  ApplicationsIcon,
  FullscreenIcon,
  ExitFullscreenIcon
} from '../../../vectors';

import {connect, ActionBarContainer, CropperContainer} from '../../../containers';

const mainStyle = css`
  .main {
    height: 50px;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-around;
  }
`;

const MainControls = {};

class Left extends React.Component {
  render() {
    const {toggleAdvanced, toggleRatioLock, ratioLocked} = this.props;

    return (
      <div className="main">
        <CropIcon onClick={toggleAdvanced}/>
        <LinkIcon active={ratioLocked} onClick={() => toggleRatioLock()}/>
        <style jsx>{mainStyle}</style>
      </div>
    );
  }
}

Left.propTypes = {
  toggleAdvanced: PropTypes.func.isRequired,
  toggleRatioLock: PropTypes.func.isRequired,
  ratioLocked: PropTypes.bool
};

MainControls.Left = connect(
  [ActionBarContainer],
  ({ratioLocked}) => ({ratioLocked}),
  ({toggleAdvanced, toggleRatioLock}) => ({toggleAdvanced, toggleRatioLock})
)(Left);

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

class Right extends React.Component {
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
    const {enterFullscreen, exitFullscreen, fullscreen, appSelected} = this.props;

    return (
      <div className="main">
        <ApplicationsIcon active={Boolean(appSelected)} onClick={() => menu.popup()}/>
        {
          fullscreen ?
            <ExitFullscreenIcon onClick={exitFullscreen}/> :
            <FullscreenIcon onClick={enterFullscreen}/>
        }
        <style jsx>{mainStyle}</style>
      </div>
    );
  }
}

Right.propTypes = {
  enterFullscreen: PropTypes.func.isRequired,
  exitFullscreen: PropTypes.func.isRequired,
  selectApp: PropTypes.func.isRequired,
  fullscreen: PropTypes.bool,
  appSelected: PropTypes.string
};

MainControls.Right = connect(
  [CropperContainer],
  ({fullscreen, appSelected}) => ({fullscreen, appSelected}),
  ({enterFullscreen, exitFullscreen, selectApp}) => ({enterFullscreen, exitFullscreen, selectApp})
)(Right);

export default MainControls;
