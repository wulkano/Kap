'use strict';

// The goal of this file is validating accelerator values we receive from the user
// to make sure that they are can be used with the electron api https://www.electronjs.org/docs/api/accelerator

// Also, this extracts the right accelerator from a keyboard event, checking the
// location for numpad keys and special characters for when shift is pressed

const modifiers = ['Command', 'Alt', 'Option', 'Shift', 'Cmd', 'Control', 'Ctrl'];

const codes = [
  'Plus',
  'Space',
  'Tab',
  'Capslock',
  'Numlock',
  'Scrolllock',
  'Backspace',
  'Delete',
  'Insert',
  'Return',
  'Enter',
  'Up',
  'Down',
  'Left',
  'Right',
  'PageUp',
  'PageDown',
  'Escape',
  'Esc',
  'VolumeUp',
  'VolumeDown',
  'VolumeMute',
  'num0',
  'num1',
  'num2',
  'num3',
  'num4',
  'num5',
  'num6',
  'num7',
  'num8',
  'num9',
  'numdec',
  'numadd',
  'numsub',
  'nummult',
  'numdiv'
];

const keyCodeRegex = new RegExp('^([\\dA-Z~`!@#$%^&*()_+=.,<>?;:\'"\\-\\/\\\\\\[\\]\\{\\}\\|]|F([1-9]|1[\\d]|2[0-4])|' + codes.join('|') + ')$');

const shiftKeyMap = new Map([
  ['~', '`'],
  ['!', '1'],
  ['@', '2'],
  ['#', '3'],
  ['$', '4'],
  ['%', '5'],
  ['^', '6'],
  ['&', '7'],
  ['*', '8'],
  ['(', '9'],
  [')', '0'],
  ['_', '-'],
  ['+', '='],
  ['{', '['],
  ['}', ']'],
  ['|', '\\'],
  [':', ';'],
  ['"', '\''],
  ['<', ','],
  ['>', '.'],
  ['?', '/']
]);

const numpadKeyMap = new Map([
  ['0', 'num0'],
  ['1', 'num1'],
  ['2', 'num2'],
  ['3', 'num3'],
  ['4', 'num4'],
  ['5', 'num5'],
  ['6', 'num6'],
  ['7', 'num7'],
  ['8', 'num8'],
  ['9', 'num9'],
  ['.', 'numdec'],
  ['+', 'numadd'],
  ['-', 'numsub'],
  ['*', 'nummult'],
  ['/', 'numdiv']
]);

const namedKeyCodeMap = new Map([
  [' ', 'Space'],
  ['CapsLock', 'Capslock'],
  ['ArrowUp', 'Up'],
  ['ArrowDown', 'Down'],
  ['ArrowLeft', 'Left'],
  ['ArrowRight', 'Right'],
  ['Clear', 'Numlock']
]);

const checkAccelerator = accelerator => {
  if (!accelerator) {
    return true;
  }

  const parts = accelerator.split('+');

  if (parts.length < 2) {
    return false;
  }

  if (!keyCodeRegex.test(parts[parts.length - 1])) {
    return false;
  }

  const metaKeys = parts.slice(0, -1);
  return metaKeys.every(part => modifiers.includes(part)) && metaKeys.some(part => part !== 'Shift');
};

const eventKeyToAccelerator = (key, location) => {
  if (location === 3) {
    return numpadKeyMap.get(key);
  }

  return namedKeyCodeMap.get(key) || shiftKeyMap.get(key) || key.toUpperCase();
};

module.exports = {
  checkAccelerator,
  eventKeyToAccelerator
};
