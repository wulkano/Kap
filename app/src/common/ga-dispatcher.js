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
    const opts = options ? options : {};

    // Check for old UUID and assign it
    if (localStorage.kapUUID) {
      opts.uuid = localStorage.kapUUID;
    }

    // Enable https by default
    const uaOpts = Object.assign(opts, {
      https: true,
      appVersion: process.env.npm_package_version
    });

    // Assign ua to an internal session variable
    this.session = ua(uaOpts);
    this.queue = [];
    this.networkStatus = navigator.onLine;

    // Store the current user's UUID in localStorage if
    // the ua object was assigned properly.
    if (this.session.cid) {
      this.session.cid = localStorage.kapUUID;
    }

    // this._registerNetworkListener();
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
    console.log(opt, data);
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
   * @param {string[]} eventType - Kind of event to send. [pageview, event]
   * @param {Object} [metadata] - Optional
   */
  send(eventType, metadata) {
    console.log('Attempting to send request:', eventType, metadata);
    const session = this.getOpt('session');
    session[eventType](metadata, this.callback);
  }

  /**
   * Consumes any errors from GA and assigns them to a queue for retrying.
   * @param {Object} error
   */
  callback(error) {
    if (error && error !== null) {
      switch (error.code) {
        case 'ENOTFOUND': {
          console.error('Could not contact the server.');
          break;
        }
        case 'ETIMEDOUT': {
          console.error('Request timed out.');
          break;
        }
        default: {
          const queue = this.getOpt('queue');
          queue.push(error);
        }
      }
    } else {
      console.log('Request sent.');
    }
  }

  /**
   * Instantiates a listener for NetworkInformation events.
   */
  _registerNetworkListener() {
    window.addEventListener('offline online', function () {
      this.setOpt('networkStatus', navigator.onLine);
      if (navigator.onLine) {
        console.log('Network offline. Queueing all further requests for dispatch.');
      } else {
        console.log('Network online. Will redispatch queued requests when possible.');
      }
    });

    console.log('Listening for network events.');
  }

  /**
   * Determines if we can dispatch any queued requests yet.
   * Returns true if we can safely dispatch.
   * @return {Boolean}
   */
  _canDispatch() {
    return this.getOpt('networkStatus');
  }

}

module.exports = (...args) => {
  return new GADispatcher(...args);
};
