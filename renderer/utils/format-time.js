import moment from 'moment';

const formatTime = (time, options) => {
  options = {
    showMilliseconds: true,
    ...options
  };

  const format = `m:ss${options.showMilliseconds ? '.SS' : ''}`;

  const durationFormatted = options.extra ?
    `  (${moment()
      .startOf('day')
      .milliseconds(options.extra * 1000)
      .format(format)})` :
    '';

  return `${moment()
    .startOf('day')
    .milliseconds(time * 1000)
    .format(format)}${durationFormatted}`;
};

export default formatTime;
