import React from 'react';
import PropTypes from 'prop-types';

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
      ctrlKey && '⌃',
      shiftKey && '⇧',
      char
    ].filter(Boolean).filter(key => key !== '');

    return keys.map(key => <Key key={key}>{key}</Key>);
  }

  inputRef = React.createRef()

  render() {
    return (
      <div className="root" onClick={() => this.inputRef.current.focus()}>
        {this.renderKeys()}
        <input ref={this.inputRef} onKeyUp={this.store} onKeyDown={this.handleKeyDown} onChange={noop}/>
        <style jsx>{`
          .root {
            position: relative;
            padding: 1px 3px;
            background: #F9F9F9;
            border-radius: 3px 3px 3px 3px;
            border: 1px solid #DDDDDD;
            height: 25px;
            width: 96px;
            cursor: text;
          }
          input {
            display: inline-block;
            width: 1px;
            outline: none !important;
            border: none;
            background: transparent;
          }
        `}</style>
      </div>
    );
  }
}
