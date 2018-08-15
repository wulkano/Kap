import moment from 'moment';

const formatTime = (time, duration) => {
  const durationFormatted = duration ?
    `  (${moment()
      .startOf('day')
      .milliseconds(duration * 1000)
      .format('m:ss.SS')})` :
    '';

  return `${moment()
    .startOf('day')
    .milliseconds(time * 1000)
    .format('m:ss.SS')}${durationFormatted}`;
};

export default formatTime;
