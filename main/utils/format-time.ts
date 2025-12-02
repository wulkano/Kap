import moment from 'moment';

const formatTime = (time: number, options: any) => {
  options = {
    showMilliseconds: false,
    ...options
  };

  const durationFormatted = options.extra ?
    `  (${format(options.extra, options)})` :
    '';

  return `${format(time, options)}${durationFormatted}`;
};

const format = (time: number, {showMilliseconds} = {showMilliseconds: false}) => {
  const formatString = `${time >= 60 * 60 ? 'hh:m' : ''}m:ss${showMilliseconds ? '.SS' : ''}`;

  return moment().startOf('day').add(time, 'seconds').format(formatString);
};

export default formatTime;
