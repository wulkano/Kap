// Git dat analytics
const ua = require('universal-analytics');

/**
 * An instance of GADispatcher, which deals with sending
 * data to Google Analytics.
 */
class GADispatcher {

  /**
   * Instantiates the GADispatcher instance.
   * If no identifier is given, one is generated automatically.
   *
   * @param {string} trackingId - A Google Analytics tracking ID
   * @param {string} [identifier] - Optional identifier in UUID format
   * @param {Object} [options] - Options to pass to the UA instance
   * @constructor
   */
  constructor(trackingId, identifier, options) {
    const currentId = this.getOpt('_id');
    const opts = options ? options : {};

    // Prevent duplicate instances of GADispatcher from running.
    if (currentId === trackingId) {
      return Error(`Instance of GADispatcher already instantiated. Current GA ID: ${currentId}`);
    }

    // Enable https by default
    const uaOpts = Object.assign(opts, {
      https: true,
      appVersion: process.env.npm_package_version
    });

    // Assign ua to a session variable
    this.session = ua(uaOpts);
    console.log('GADispatcher started.', this.session);
  }

  getOpt(opt) {
    return this[opt];
  }

  setOpt(opt, data) {
    if (opt) {
      this.opt = data;
    }
  }

  /**
   * Dispatches an event or pageview to Google Analytics.
   *
   * @param {string} eventName - The shortname for the event.
   * @param {string[]} eventType - Kind of event to send. [pageview, event]
   * @param {Object} [metadata] - Optional
   */
  send(eventName, eventType, metadata) {
    let dispatchEventType;

    switch (eventType) {
      case 'pageview' :
        dispatchEventType = ua.pageview(metadata);
        break;
      case 'event' :
        dispatchEventType = ua.event(metadata);
        break;
      default:
        this.dispatch(dispatchEventType);
    }
  }

  /**
   * Fires the network request.
   *
   * In the event of a failure, the consumeError callback will
   * attempt to recover the request and resend it later.
   *
   * @param {Object} method - The method type.
   */
  dispatch(method) {
    // servicewerkit and promises?
  }

  /**
   * Consumes any errors from GA and assigns them to a queue for retrying.
   * @param {Object} error
   */
  consumeError(error) {
    // @TODO eat errors properly.
    const consumable = error;
    console.log('Error handling currently not implemented.', consumable);
  }

}

module.exports = (...args) => {
  return new GADispatcher(...args);
};
