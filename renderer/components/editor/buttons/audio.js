import React from 'react';
import PropTypes from 'prop-types';
import {VolumeHighIcon, VolumeOffIcon} from '../../../vectors';

const Audio = ({isMuted = false, toggleMuted}) => <span onClick={toggleMuted}>{isMuted ? <VolumeOffIcon shadow fill="#FFF" hoverFill="#FFF"/> : <VolumeHighIcon shadow fill="#FFF" hoverFill="#FFF"/>}</span>;
Audio.propTypes = {
  toggleMuted: PropTypes.func.isRequired,
  isMuted: PropTypes.bool
};

export default Audio;
