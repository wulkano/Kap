import moment from 'moment';

export const generateTimestampedName = (title = 'Kapture', extension = '') => `${title} ${moment().format('YYYY-MM-DD')} at ${moment().format('HH.mm.ss')}${extension}`;
