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
  };

  render() {
    const {onChange, min, max, ...rest} = this.props;

    return (
      <input {...rest} ref={this.inputRef} type="text" onChange={onChange} onKeyDown={handleInputKeyPress(onChange, min, max)}/>
    );
  }
}

KeyboardNumberInput.propTypes = {
  onKeyDown: PropTypes.elementType,
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.elementType
};

export default KeyboardNumberInput;
