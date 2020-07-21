import React, {useRef, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {shake} from '../../utils/inputs';
import {checkAccelerator, eventKeyToAccelerator} from '../../../main/utils/accelerator-validator';

const Key = ({children}) => (
  <span>
    {children}
    <style jsx>{`
    span {
      color: var(--title-color);
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: 500;
      font-size: 12px;
      background: var(--shortcut-key-background);
      border-radius: 4px 4px 4px 4px;
      border: 1px solid var(--shortcut-key-border);
      height: 20px;
      padding: 0 5px;
      margin-right: 2px;
      box-sizing: border-box;
      box-shadow: var(--shortcut-box-shadow);
      test-transform: uppercase;
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

const metaCharacters = new Map([
  ['Command', '⌘'],
  ['Alt', '⌥'],
  ['Option', '⌥'],
  ['Shift', '⇧'],
  ['Cmd', '⌘'],
  ['Control', '⌃'],
  ['Ctrl', '⌃']
]);

const ShortcutInput = ({shortcut = '', onChange, tabIndex}) => {
  const [keys, setKeys] = useState(shortcut.split('+').filter(Boolean));
  const [isEditing, setIsEditing] = useState(false);
  const boxRef = useRef();
  const inputRef = useRef();

  const resetKeys = () => setKeys(shortcut.split('+').filter(Boolean));

  useEffect(() => {
    resetKeys();
  }, [shortcut]);

  const keysToRender = keys.map(key => {
    return metaCharacters.get(key) || key;
  });

  const clearShortcut = () => {
    setKeys([]);
    onChange(undefined);
  };

  const cancel = event => {
    const {metaKey, altKey, ctrlKey, shiftKey, key} = event;
    const metaKeys = [
      metaKey && 'Command',
      altKey && 'Alt',
      ctrlKey && 'Control',
      shiftKey && 'Shift'
    ].filter(Boolean);

    if (metaKeys.length > 0 && ['Shift', 'Control', 'Alt', 'Meta'].includes(key)) {
      setKeys(metaKeys);
      return;
    }

    shake(boxRef.current);
    resetKeys();
    setIsEditing(false);
  };

  const handleKeyDown = event => {
    const {metaKey, altKey, ctrlKey, shiftKey, key, location} = event;
    const metaKeys = [
      metaKey && 'Command',
      altKey && 'Alt',
      ctrlKey && 'Control',
      shiftKey && 'Shift'
    ].filter(Boolean);

    if (metaKeys.length === 0) {
      if (key === 'Tab') {
        return;
      }

      if (['Escape', 'Delete', 'Backspace'].includes(key)) {
        clearShortcut();
        return;
      }
    }

    // Handled by the `onPaste` event
    if (metaKeys.length === 1 && metaKeys && key.toUpperCase() === 'V') {
      return;
    }

    if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) {
      setKeys(metaKeys);
      setIsEditing(true);
      return;
    }

    const keys = [...metaKeys, eventKeyToAccelerator(key, location)];
    const accelerator = keys.join('+');
    setIsEditing(false);
    if (checkAccelerator(accelerator)) {
      setKeys(keys);
      onChange(accelerator);
    } else {
      shake(boxRef.current);
      resetKeys();
    }
  };

  const paste = event => {
    const text = (event.clipboardData || window.clipboardData).getData('text');

    setIsEditing(false);
    if (checkAccelerator(text)) {
      setKeys(text.split('+').filter(Boolean));
      onChange(text);
    } else {
      shake(boxRef.current);
      resetKeys();
    }
  };

  const className = classNames('box', {invalid: false});

  return (
    <div className="shortcut-input">
      <div ref={boxRef} className={className} onClick={() => inputRef.current.focus()}>
        {keysToRender.map(key => <Key key={key}>{key}</Key>)}
        <input
          ref={inputRef}
          tabIndex={tabIndex}
          onKeyDown={handleKeyDown}
          onKeyUp={isEditing ? cancel : undefined}
          onBlur={isEditing ? cancel : undefined}
          onPaste={paste}
        />
      </div>
      <button type="button" tabIndex={tabIndex} onClick={clearShortcut}>
        <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24">
          <path fill="var(--icon-color)" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
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
          background: var(--input-background-color);
          border-radius: 3px;
          border: 1px solid var(--input-border-color);
          width: 120px;
          cursor: text;
          display: flex;
          height: 24px;
          box-sizing: border-box;
        }

        .box:focus-within {
          border-color: var(--input-focus-border-color);
        }

        input {
          display: inline-block;
          width: 1px;
          outline: none !important;
          border: none;
          background: transparent;
          color: var(--title-color);
        }

        .invalid:focus-within {
          border-color: red;
        }

        button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          background: var(--input-background-color);
          border-radius: 3px 3px 3px 3px;
          padding: 1px 3px;
          border: 1px solid var(--input-border-color);
          margin-left: 8px;
          width: 24px;
          height: 24px;
          box-sizing: border-box;
          outline: none;
        }

        button:focus {
          border-color: var(--kap);
        }

        button:hover {
          --icon-color: var(--navigation-item-hover-color);
        }
      `}</style>
    </div>
  );
};

ShortcutInput.propTypes = {
  shortcut: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  tabIndex: PropTypes.number.isRequired
};

export default ShortcutInput;
