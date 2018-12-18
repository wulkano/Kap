import React from 'react';
import PropTypes from 'prop-types';
import {handleInputKeyPress} from '../utils/inputs';

class KeyboardNumberInput extends React.Component {
  render() {
    const {onKeyDown, min, max, ...rest} = this.props;

    return (
      <input {...rest} type="text" onKeyDown={handleInputKeyPress(onKeyDown, min, max)}/>
    );
  }
}

KeyboardNumberInput.propTypes = {
  onKeyDown: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number
};

export default KeyboardNumberInput;
