import React from 'react';
import * as Sentry from '@sentry/browser';
import electron from 'electron';
import type {api as Api, is as Is} from 'electron-util';

import {isDevelopment} from './environment';

const SENTRY_PUBLIC_DSN = 'https://2dffdbd619f34418817f4db3309299ce@sentry.io/255536';

class SentryErrorBoundary extends React.Component<{children: React.ReactNode}> {
  constructor(props) {
    super(props);
    const {settings} = require('@electron/remote').require('./common/settings');
    // Done in-line because this is used in _app
    const {api} = require('electron-util') as {
      api: typeof Api;
      is: typeof Is;
    };

    if (!isDevelopment() && settings.get('allowAnalytics')) {
      const release = `${api.app.name}@${api.app.getVersion()}`.toLowerCase();
      Sentry.init({dsn: SENTRY_PUBLIC_DSN, release});
    }
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo);
    Sentry.configureScope(scope => {
      for (const [key, value] of Object.entries(errorInfo)) {
        scope.setExtra(key, value);
      }
    });

    Sentry.captureException(error);

    // This is needed to render errors correctly in development / production
    super.componentDidCatch(error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

export default SentryErrorBoundary;
