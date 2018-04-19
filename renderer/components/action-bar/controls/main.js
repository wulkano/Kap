// Packages
import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';
import css from 'styled-jsx/css';

// Vectors
import {
  LinkIcon,
  CropIcon,
  ApplicationsIcon,
  FullscreenIcon,
  ExitFullscreenIcon
} from '../../../vectors';

// Containers
import {connect, ActionBarContainer, CropperContainer} from '../../../containers';

const mainStyle = css`
  .main {
    heigth: 50px;
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

class Right extends React.Component {
  remote = electron.remote || false;

  componentDidMount() {
    const {buildWindowsMenu, activateWindow} = this.remote.require('./common/windows');
    const {setApp, bindRebuildMenu, appSelected} = this.props;

    const onSelect = win => {
      activateWindow(win);
      setApp(win);
    };

    const build = async appSelected => {
      console.log('rebuilding with ', appSelected);
      this.menu = await buildWindowsMenu(onSelect, appSelected);
    };

    bindRebuildMenu(build);
    build(appSelected);
  }

  render() {
    const {enterFullscreen, exitFullscreen, fullscreen, appSelected} = this.props;

    return (
      <div className="main">
        <ApplicationsIcon active={Boolean(appSelected)} onClick={() => this.menu.popup()}/>
        { !fullscreen && <FullscreenIcon onClick={enterFullscreen}/> }
        { fullscreen && <ExitFullscreenIcon onClick={exitFullscreen}/> }
        <style jsx>{mainStyle}</style>
      </div>
    );
  }
}

Right.propTypes = {
  enterFullscreen: PropTypes.func.isRequired,
  exitFullscreen: PropTypes.func.isRequired,
  setApp: PropTypes.func.isRequired,
  bindRebuildMenu: PropTypes.func.isRequired,
  fullscreen: PropTypes.bool,
  appSelected: PropTypes.string
};

MainControls.Right = connect(
  [CropperContainer],
  ({fullscreen, appSelected}) => ({fullscreen, appSelected}),
  ({enterFullscreen, exitFullscreen, setApp, bindRebuildMenu}) => ({enterFullscreen, exitFullscreen, setApp, bindRebuildMenu})
)(Right);

export default MainControls;
