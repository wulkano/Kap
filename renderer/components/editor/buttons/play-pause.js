import React from 'react';
import PropTypes from 'prop-types';
import {PlayIcon, PauseIcon} from '../../../vectors';

const PlayPause = ({isPlaying = false, onClick}) => <span onClick={onClick}>{isPlaying ? <PauseIcon shadow fill="#FFF" hoverFill="#FFF"/> : <PlayIcon shadow fill="#FFF" hoverFill="#FFF"/>}</span>;
PlayPause.propTypes = {
  onClick: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool
};

export default PlayPause;
