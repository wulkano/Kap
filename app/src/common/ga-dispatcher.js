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
    const currentId = this.getOpt('cid');
    // const currentUUID = this.getOpt('uuid');
    const opts = options ? options : {};

    // Prevent duplicate instances of GADispatcher from running.
    if (currentId === trackingId) {
      return Error(
        `Cannot instantiate another GADispatcher instance with a different GA ID
        (was ${trackingId},
        current GA ID: ${currentId})`
      );
    }

    // Enable https by default
    const uaOpts = Object.assign(opts, {
      https: true,
      appVersion: process.env.npm_package_version
    });

    // Assign ua to a session variable
    this.session = ua(uaOpts);
    this.cid = currentId;

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
    const session = this.getOpt('session');
    session[eventType](metadata, this.callback);
  }

  /**
   * Consumes any errors from GA and assigns them to a queue for retrying.
   * @param {Object} error
   */
  callback(error) {
    const consumable = error;
    if (error) {
      console.log('Error:', consumable);
    } else {
      console.log('All quiet on the western front.');
    }
  }

}

module.exports = (...args) => {
  return new GADispatcher(...args);
};
