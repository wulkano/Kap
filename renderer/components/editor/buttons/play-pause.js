import React from 'react';
import PropTypes from 'prop-types';
import {PlayIcon, PauseIcon} from '../../../vectors';

const PlayPause = ({isPlaying = false, pause, play}) => <span onClick={isPlaying ? pause : play}>{isPlaying ? <PauseIcon shadow fill="#FFF" hoverFill="#FFF"/> : <PlayIcon shadow fill="#FFF" hoverFill="#FFF"/>}</span>;
PlayPause.propTypes = {
  play: PropTypes.func.isRequired,
  pause: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool
};

export default PlayPause;
