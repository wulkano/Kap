import React from 'react';
import PropTypes from 'prop-types';
import {FullscreenIcon, ExitFullscreenIcon} from '../../../vectors';

const Fullscreen = ({isFullscreen = false, toggleFullscreen}) => <span onClick={toggleFullscreen} style={{marginLeft: '16px'}}>{isFullscreen ? <ExitFullscreenIcon shadow fill="#FFF" hoverFill="#FFF"/> : <FullscreenIcon shadow fill="#FFF" hoverFill="#FFF"/>}</span>;
Fullscreen.propTypes = {
  toggleFullscreen: PropTypes.func.isRequired,
  isFullscreen: PropTypes.bool
};

export default Fullscreen;
