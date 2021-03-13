import sinon from 'sinon';

export const isSentryEnabled = true;

export default {
  captureException: sinon.fake()
};
