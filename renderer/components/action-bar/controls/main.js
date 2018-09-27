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

const buildMenu = async ({selectedApp}) => {
  const {buildWindowsMenu} = remote.require('./common/windows');
  menu = await buildWindowsMenu(selectedApp);
};

class Left extends React.Component {
  state = {};

  icon = React.createRef();

  static getDerivedStateFromProps(nextProps, prevState) {
    const {selectedApp} = nextProps;

    if (selectedApp !== prevState.selectedApp) {
      buildMenu({selectedApp});
      return {selectedApp};
    }

    return null;
  }

  openMenu = () => {
    const boundingRect = this.icon.current.getBoundingClientRect();
    const {bottom, left} = boundingRect;

    menu.popup({
      x: Math.round(left),
      y: Math.round(bottom)
    });
  }

  render() {
    const {toggleAdvanced, selectedApp} = this.props;

    return (
      <div className="main">
        <div className="crop">
          <CropIcon onClick={toggleAdvanced}/>
        </div>
        <div ref={this.icon}><ApplicationsIcon active={Boolean(selectedApp)} onClick={this.openMenu}/></div>
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
  icon = React.createRef();

  openMenu = () => {
    const boundingRect = this.icon.current.getBoundingClientRect();
    const {bottom, left} = boundingRect;

    electron.remote.require('./menus').cogMenu.popup({
      x: Math.round(left),
      y: Math.round(bottom)
    });
  }

  render() {
    const {enterFullscreen, exitFullscreen, isFullscreen} = this.props;

    return (
      <div className="main">
        <div className="fullscreen">
          {
            isFullscreen ?
              <ExitFullscreenIcon active onClick={exitFullscreen}/> :
              <FullscreenIcon onClick={enterFullscreen}/>
          }
        </div>
        <div ref={this.icon}><MoreIcon onClick={this.openMenu}/></div>
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
