const shortcutToAccelerator = shortcut => {
  const {metaKey, altKey, ctrlKey, shiftKey, character} = shortcut;
  if (!character) {
    throw new Error(`shortcut needs character ${JSON.stringify(shortcut)}`);
  }

  const keys = [
    metaKey && 'Command',
    altKey && 'Option',
    ctrlKey && 'Control',
    shiftKey && 'Shift',
    character
  ].filter(Boolean);
  return keys.join('+');
};

module.exports = shortcutToAccelerator;
