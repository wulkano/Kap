'use strict';

module.exports.almostEquals = (actual, expected, threshold = 0.5) => {
  return Math.abs(actual - expected) <= threshold ? true : `
  Actual: ${actual}
  Expected: ${expected}
  Threshold: ${threshold}
  Diff: ${Math.abs(actual - expected)}
  `;
};
