'use strict';
const moment = require('moment');

module.exports = {
  generateTimestampedName: (title = 'New Recording', extension = '') => `${title} ${moment().format('YYYY-MM-DD')} at ${moment().format('HH.mm.ss')}${extension}`
};
