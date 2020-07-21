import moment from 'moment';

const formatTime = (time, options) => {
  options = {
    showMilliseconds: true,
    ...options
  };

  const durationFormatted = options.extra ?
    `  (${format(options.extra, options)})` :
    '';

  return `${format(time, options)}${durationFormatted}`;
};

const format = (time, {showMilliseconds} = {}) => {
  const formatString = `${time >= 60 * 60 ? 'h:m' : ''}m:ss${showMilliseconds ? '.SS' : ''}`;

  return moment().startOf('day').millisecond(time * 1000).format(formatString);
};

export default formatTime;
