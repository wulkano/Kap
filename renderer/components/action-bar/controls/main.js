// Packages
import React from 'react';
import css from 'styled-jsx/css'
import electron from 'electron';

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
      <div className='main'>
        <CropIcon onClick={toggleAdvanced}/>
        <LinkIcon active={ratioLocked} onClick={() => toggleRatioLock()}/>
        <style jsx>{mainStyle}</style>
      </div>
    );
  }
}

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
    getWindows().then(a => console.log('GOT ',a));

    menu = new Menu();
    console.log(windows);

    windows.forEach(win => {
      menu.append(new MenuItem({
        label: win.ownerName,
        // icon: icon ? icon.resize({width: 16, height: 16}) : null,
        type: 'radio',
        checked: false,
        click: () => {
          console.log('asd');
        }
      }));
    });
  }
}

class Right extends React.Component {
  componentDidMount() {
    buildMenu();
  }

  render() {
    const {enterFullscreen, exitFullscreen, fullscreen} = this.props;

    return (
      <div className='main'>
        <ApplicationsIcon onClick={() => menu.popup()}/>
        { !fullscreen && <FullscreenIcon onClick={enterFullscreen}/> }
        { fullscreen && <ExitFullscreenIcon onClick={exitFullscreen}/> }
        <style jsx>{mainStyle}</style>
      </div>
    );
  }
}

MainControls.Right = connect(
  [CropperContainer],
  ({fullscreen}) => ({fullscreen}),
  ({enterFullscreen, exitFullscreen}) => ({enterFullscreen, exitFullscreen})
)(Right);

export default MainControls;
