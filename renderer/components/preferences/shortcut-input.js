import React from 'react';
import PropTypes from 'prop-types';

const noop = () => {};
export default class ShortcutInput extends React.Component {
  static propTypes = {
    metaKey: PropTypes.bool.isRequired,
    altKey: PropTypes.bool.isRequired,
    ctrlKey: PropTypes.bool.isRequired,
    shiftKey: PropTypes.bool.isRequired,
    char: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  }

  state = {
    metaKey: this.props.metaKey || false,
    altKey: this.props.altKey || false,
    ctrlKey: this.props.ctrlKey || false,
    shiftKey: this.props.shiftKey || false,
    char: this.props.char || ''
  }

  handleKeyDown = event => {
    event.preventDefault();
    const {metaKey, altKey, ctrlKey, shiftKey} = event;
    const char = String.fromCharCode(event.which);
    this.setState({metaKey, altKey, ctrlKey, shiftKey, char});
  }

  store = () => {
    if (this.state.string === '') {
      throw new Error('Needs string');
    } else {
      this.props.onChange(this.state);
    }
  }

  renderKeys = () => {
    const {metaKey, altKey, ctrlKey, shiftKey, char} = this.state;
    const keys = [
      metaKey && '⌘',
      altKey && '⌥',
      ctrlKey && 'ctrl',
      shiftKey && '⇧',
      char
    ].filter(Boolean);
    return `${keys.join('+')}`;
  }

  render() {
    return <input value={this.renderKeys()} onKeyUp={this.store} onKeyDown={this.handleKeyDown} onChange={noop}/>;
  }
}
