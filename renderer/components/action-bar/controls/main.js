import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';
import css from 'styled-jsx/css';

import IconMenu from '../../icon-menu';
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

const buildMenu = async ({selectedApp}) => {
  const {buildWindowsMenu} = remote.require('./common/windows');
  menu = await buildWindowsMenu(selectedApp);
};

class Left extends React.Component {
  state = {};

  static getDerivedStateFromProps(nextProps, prevState) {
    const {selectedApp} = nextProps;

    if (selectedApp !== prevState.selectedApp) {
      buildMenu({selectedApp});
      return {selectedApp};
    }

    return null;
  }

  render() {
    const {toggleAdvanced, selectedApp} = this.props;

    return (
      <div className="main">
        <div className="crop">
          <CropIcon viewBox="-1.75 -1.75 28 28" onClick={toggleAdvanced}/>
        </div>
        <IconMenu onOpen={menu && menu.popup}><ApplicationsIcon active={Boolean(selectedApp)}/></IconMenu>
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
  selectedApp: PropTypes.string
};

MainControls.Left = connect(
  [CropperContainer, ActionBarContainer],
  ({selectedApp}) => ({selectedApp}),
  ({selectApp}, {toggleAdvanced}) => ({selectApp, toggleAdvanced})
)(Left);

class Right extends React.Component {
  render() {
    const {enterFullscreen, exitFullscreen, isFullscreen} = this.props;

    return (
      <div className="main">
        <div className="fullscreen">
          {
            isFullscreen ?
              <ExitFullscreenIcon active viewBox="2 2 20 20" onClick={exitFullscreen}/> :
              <FullscreenIcon viewBox="2 2 20 20" onClick={enterFullscreen}/>
          }
        </div>
        <IconMenu onOpen={electron.remote.require('./menus').cogMenu.popup}><MoreIcon viewBox="2 2 20 20"/></IconMenu>
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
  isFullscreen: PropTypes.bool
};

MainControls.Right = connect(
  [CropperContainer],
  ({isFullscreen}) => ({isFullscreen}),
  ({enterFullscreen, exitFullscreen}) => ({enterFullscreen, exitFullscreen})
)(Right);

export default MainControls;
