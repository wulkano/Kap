export const validateNumericInput = (input, opts) => {
  let value = input.value;

  if (value === '' && opts.empty) {
    return value;
  }

  if (!value) {
    return opts.lastValidValue || null;
  }

  value = parseInt(value, 10);

  if (!/^\d{1,5}$/.test(value)) {
    opts.onInvalid(input);
    return opts.lastValidValue;
  }

  if (opts.max && value > opts.max) {
    opts.onInvalid(input);
    return opts.max;
  }

  if (opts.min && value < opts.min) {
    opts.onInvalid(input);
    return opts.min;
  }

  return value;
};

export const handleKeyDown = event => {
  const multiplier = event.shiftKey ? 10 : 1;
  const parsedValue = parseInt(event.target.value, 10);

  if (event.key === 'ArrowUp') {
    event.target.value = parsedValue + (1 * multiplier); // eslint-disable-line no-implicit-coercion
    event.target.dispatchEvent(new Event('input'));
  } else if (event.key === 'ArrowDown') {
    event.target.value = parsedValue - (1 * multiplier); // eslint-disable-line no-implicit-coercion
    event.target.dispatchEvent(new Event('input'));
  }
};
