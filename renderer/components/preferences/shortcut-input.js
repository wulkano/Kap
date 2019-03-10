import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {shake} from '../../utils/inputs';

const Key = ({children}) => (
  <span>
    {children}
    <style jsx>{`
    span {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      background: #FFFFFF;
      border-radius: 4px 4px 4px 4px;
      border: 1px solid #DDDDDD;
      height: 20px;
      width: 20px;
      margin-right: 2px;
      box-sizing: border-box;
    }
  `}</style>
  </span>
);

Key.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default class ShortcutInput extends React.Component {
  state = {
    metaKey: (this.props.shortcut && this.props.shortcut.metaKey) || false,
    altKey: (this.props.shortcut && this.props.shortcut.altKey) || false,
    ctrlKey: (this.props.shortcut && this.props.shortcut.ctrlKey) || false,
    shiftKey: (this.props.shortcut && this.props.shortcut.shiftKey) || false,
    character: (this.props.shortcut && this.props.shortcut.character) || ''
  }

  handleKeyDown = event => {
    if (event.which === 9) {
      return;
    }

    event.preventDefault();
    const {metaKey, altKey, ctrlKey, shiftKey} = event;
    const INVALID_KEYS = [17, 16, 91, 8, 18];
    const character = INVALID_KEYS.includes(event.which) ? '' : String.fromCharCode(event.which);
    this.setState({metaKey, altKey, ctrlKey, shiftKey, character});
  }

  get isValid() {
    const {metaKey, altKey, ctrlKey, shiftKey, character} = this.state;

    if (![metaKey, altKey, ctrlKey, shiftKey].includes(true)) {
      return false;
    }

    if (character.length === 0) {
      return false;
    }

    return true;
  }

  get isEmpty() {
    const {metaKey, altKey, ctrlKey, shiftKey, character} = this.state;

    return ![metaKey, altKey, ctrlKey, shiftKey, character].some(Boolean);
  }

  store = event => {
    if (event.which === 9) {
      return;
    }

    if (this.isValid) {
      this.props.onChange(this.state);
    } else {
      shake(this.boxRef.current);
    }
  }

  renderKeys = () => {
    const {metaKey, altKey, ctrlKey, shiftKey, character} = this.state;
    const keys = [
      metaKey && '⌘',
      altKey && '⌥',
      ctrlKey && '⌃',
      shiftKey && '⇧',
      character
    ].filter(Boolean);

    return keys.map(key => <Key key={key}>{key}</Key>);
  }

  clearShortcut = () => {
    this.setState({metaKey: false, altKey: false, ctrlKey: false, shiftKey: false, character: ''});
    this.props.onChange(null);
  }

  handleBlur = () => {
    if (!this.isValid) {
      this.clearShortcut();
    }
  }

  boxRef = React.createRef()

  inputRef = React.createRef()

  render() {
    const {tabIndex} = this.props;
    const className = classNames('box', {invalid: !this.isEmpty && !this.isValid});

    return (
      <div className="shortcut-input">
        <div ref={this.boxRef} className={className} onClick={() => this.inputRef.current.focus()}>
          {this.renderKeys()}
          <input
            ref={this.inputRef}
            tabIndex={tabIndex}
            onKeyUp={this.store}
            onKeyDown={this.handleKeyDown}
            onBlur={this.handleBlur}
          />
        </div>
        <button type="button" tabIndex={tabIndex} onClick={this.clearShortcut}>
          <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24">
            <path fill="#808080" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
        <style jsx>{`
          .shortcut-input {
            display: flex;
            flex-direction: row;
            align-items: stretch;
            justify-content: stretch;
          }

          .box {
            position: relative;
            padding: 1px 1px;
            background: #f9f9f9;
            border-radius: 3px 3px 3px 3px;
            border: 1px solid #ddd;
            width: 96px;
            cursor: text;
            display: flex;
            height: 24px;
            box-sizing: border-box;
          }

          .box:focus-within {
            border-color: #007aff;
          }

          input {
            display: inline-block;
            width: 1px;
            outline: none !important;
            border: none;
            background: transparent;
          }

          .invalid:focus-within {
            border-color: red;
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
            width: 24px;
            height: 24px;
            box-sizing: border-box;
            outline: none;
          }

          button:focus {
            border-color: #007aff;
          }
        `}</style>
      </div>
    );
  }
}

ShortcutInput.propTypes = {
  shortcut: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  tabIndex: PropTypes.number.isRequired
};
