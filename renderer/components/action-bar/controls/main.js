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

let menu;

const buildMenu = async () => {
  if (electron.remote) {
    const {Menu, MenuItem} = electron.remote;
    const {getWindows} = electron.remote.require('mac-windows');
    const windows = await getWindows();

    menu = new Menu();

    windows.forEach(win => {
      menu.append(new MenuItem({
        label: win.ownerName,
        type: 'radio',
        checked: false,
        click: () => {
          console.log('asd');
        }
      }));
    });
  }
};

class Right extends React.Component {
  componentDidMount() {
    buildMenu();
  }

  render() {
    const {enterFullscreen, exitFullscreen, fullscreen} = this.props;

    return (
      <div className="main">
        <ApplicationsIcon onClick={() => menu.popup()}/>
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
  fullscreen: PropTypes.bool
};

MainControls.Right = connect(
  [CropperContainer],
  ({fullscreen}) => ({fullscreen}),
  ({enterFullscreen, exitFullscreen}) => ({enterFullscreen, exitFullscreen})
)(Right);

export default MainControls;
