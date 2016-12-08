'use strict';
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
      return Error(`Cannot instantiate GADispatcher with a different GA ID
        (was ${trackingId},
        current GA ID: ${currentId})`);
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

  /**
   * Gets options from "this".
   *
   * @param {string} opt - The option to retrieve
   */
  getOpt(opt) {
    return this[opt];
  }

  /**
   * Sets an option.
   *
   * @param {string} opt - The option to set
   * @param {Object} data - The data to set
   */
  setOpt(opt, data) {
    if (opt) {
      this[opt] = data;
    }
  }

  /**
   * Dispatches an event or pageview to Google Analytics.
   *
   * In the event of a failure, the consumeError callback will
   * attempt to recover the request and resend it later.
   *
   * @param {string} eventName - The shortname for the event.
   * @param {string[]} eventType - Kind of event to send. [pageview, event]
   * @param {Object} [metadata] - Optional
   */
  send(eventName, eventType, metadata) {
    const methodSignatureLimits = {
      pageview: 4,
      event: 6,
      transaction: 6,
      item: 7,
      exception: 3,
      timing: 5
    };

    const getObjectLength = obj => {
      return Object.keys(obj).length;
    };

    const dataLength = getObjectLength(metadata);
    const currentType = methodSignatureLimits[eventType];

    if (dataLength <= currentType) {
      this.dispatch(ua[eventType](metadata, this.consumeError));
    } else {
      return Error(
        `Argument limit exceeded for event type ${eventType},
        (limit is ${currentType},
        got ${dataLength})`
      );
    }
  }

  /**
   * Fires the network request.
   *
   * @param {Object} data - The data to dispatch to GA.
   */
  dispatch(data) {
    data.send();
  }

  /**
   * Consumes any errors from GA and assigns them to a queue for retrying.
   * @param {Object} error
   */
  consumeError(error) {
    const consumable = error;
    console.log('Error handling currently not implemented.', consumable);
  }

}

module.exports = (...args) => {
  return new GADispatcher(...args);
};
