import moment from 'moment';

export const generateTimestampedName = (title = 'New Recording', extension = '') => `${title} ${moment().format('YYYY-MM-DD')} at ${moment().format('HH.mm.ss')}${extension}`
