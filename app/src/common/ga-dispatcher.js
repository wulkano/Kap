// Git dat analytics
const ua = require('universal-analytics')

// Require package.json so we can get the current application version
const pkg = require('../../package.json')

// @TODO We should consider grabbing this from a configuration file.
// const GA_ID = 'UA-84705099-2'

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

    // Ensure options exists
    let options = options ? options : {}

    // Enable https by default
    let uaOpts = Object.assign(options, {
      https: true
    })

    this.session = ua(uaOpts)
  }

  /**
   * Dispatches an event or pageview to Google Analytics.
   *
   * In the event of a failure, the consumeError method will
   * attempt to recover the request and resend it later.
   *
   * @param {string} eventName - The shortname for the event.
   * @param {string[]} eventType - Kind of event to send. [page, event]
   * @param {Object} [metadata] - Optional
   */
  public send(eventName, eventType, metadata) {
    this.dispatch();
  }

  /**
   * Fires the network request.
   */
  private dispatch() {
    //servicewerkit and promises?
  }

  /**
   * Consumes any errors from GA and assigns them to a queue for retrying.
   * @param {Object} error
   */
  private consumeError(error) {

  }

  private createWorker() {

  }

}
