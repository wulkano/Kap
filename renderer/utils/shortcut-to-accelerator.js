const shortcutToAccelerator = shortcut => {
  const {metaKey, altKey, ctrlKey, shiftKey, char} = shortcut;
  if (!char) {
    throw new Error(`shortcut needs char ${JSON.stringify(shortcut)}`);
  }
  const keys = [
    metaKey && 'Command',
    altKey && 'Option',
    ctrlKey && 'Control',
    shiftKey && 'Shift',
    char
  ].filter(Boolean);
  return keys.join('+');
};

module.exports = shortcutToAccelerator;
