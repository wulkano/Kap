import React from 'react';
import PropTypes from 'prop-types';
import {handleInputKeyPress} from '../utils/inputs';

class KeyboardNumberInput extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  getRef = () => {
    return this.inputRef;
  }

  render() {
    const {onKeyDown, min, max, ...rest} = this.props;

    return (
      <input {...rest} ref={this.inputRef} type="text" onKeyDown={handleInputKeyPress(onKeyDown, min, max)}/>
    );
  }
}

KeyboardNumberInput.propTypes = {
  onKeyDown: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number
};

export default KeyboardNumberInput;
