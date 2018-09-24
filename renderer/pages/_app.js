import electron from 'electron';
import {is} from 'electron-util';
import App from 'next/app';
import * as Sentry from '@sentry/browser';

const SENTRY_PUBLIC_DSN = 'https://2dffdbd619f34418817f4db3309299ce@sentry.io/255536';

const remote = electron.remote || false;

export default class Kap extends App {
  constructor(...args) {
    super(...args);

    if (remote) {
      const settings = remote.require('./common/settings');

      if (!is.development && settings.get('allowAnalytics')) {
        Sentry.init({dsn: SENTRY_PUBLIC_DSN});
      }
    }
  }

  componentDidCatch(error, errorInfo) {
    Sentry.configureScope(scope => {
      for (const [key, value] of Object.entries(errorInfo)) {
        scope.setExtra(key, value);
      }
    });

    Sentry.captureException(error);

    // This is needed to render errors correctly in development / production
    super.componentDidCatch(error, errorInfo);
  }
}
