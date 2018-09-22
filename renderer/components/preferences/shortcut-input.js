import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import {shake} from '../../utils/inputs';

const Key = ({children}) => (
  <span>
    {children}
    <style jsx>{`
    span {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      font-size: 10px;
      background: #FFFFFF;
      border-radius: 4px 4px 4px 4px;
      border: 1px solid #DDDDDD;
      height: 19px;
      width: 19px;
      margin-right: 2px;
    }
  `}</style>
  </span>
);

Key.propTypes = {
  children: PropTypes.element
};

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
    const INVALID_KEYS = [17, 16, 91, 8];
    const char = INVALID_KEYS.includes(event.which) ? '' : String.fromCharCode(event.which);
    this.setState({metaKey, altKey, ctrlKey, shiftKey, char});
  }

  get isValid() {
    const {metaKey, altKey, ctrlKey, shiftKey, char} = this.state;
    if (![metaKey, altKey, ctrlKey, shiftKey].includes(true)) {
      return false;
    }
    if (char.length === 0) {
      return false;
    }
    return true;
  }

  store = () => {
    if (this.isValid) {
      this.props.onChange(this.state);
    } else {
      shake(this.boxRef.current);
    }
  }

  renderKeys = () => {
    const {metaKey, altKey, ctrlKey, shiftKey, char} = this.state;
    const keys = [
      metaKey && '⌘',
      altKey && '⌥',
      ctrlKey && '⌃',
      shiftKey && '⇧',
      char
    ].filter(Boolean);

    return keys.map(key => <Key key={key}>{key}</Key>);
  }

  clearShortcut = () => {
    this.setState({metaKey: false, altKey: false, ctrlKey: false, shiftKey: false, char: ''});
    this.props.onChange(null);
  }

  boxRef = React.createRef()

  inputRef = React.createRef()

  render() {
    return (
      <div className="shortcut-input">
        <div ref={this.boxRef} className={cn('box', {invalid: !this.isValid})} onClick={() => this.inputRef.current.focus()}>
          {this.renderKeys()}
          <input ref={this.inputRef} onKeyUp={this.store} onKeyDown={this.handleKeyDown} onChange={noop}/>
        </div>
        <button type="button" onClick={this.clearShortcut}>x</button>
        <style jsx>{`
          .shortcut-input {
            display: flex;
            flex-direction: row;
            align-items: stretch;
            justify-content: stretch;
          }
          .box {
            position: relative;
            padding: 1px 3px;
            background: #F9F9F9;
            border-radius: 3px 3px 3px 3px;
            border: 1px solid #DDDDDD;
            height: 25px;
            width: 96px;
            cursor: text;
          }
          .invalid:focus-within {
            border-color: red!important;
          }
          input {
            display: inline-block;
            width: 1px;
            outline: none !important;
            border: none;
            background: transparent;
          }
          button {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            background: #FFFFFF;
            border-radius: 3px 3px 3px 3px;
            padding: 1px 3px;
            border: 1px solid #DDDDDD;
            margin-left: 8px;
            width: 28px;
          }
        `}</style>
      </div>
    );
  }
}
