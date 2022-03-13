'use strict';

import {app} from 'electron';
import * as Sentry from '@sentry/electron';

import {settings} from '../common/settings';
import {isDevelopment} from './environment';

const SENTRY_PUBLIC_DSN = 'https://2dffdbd619f34418817f4db3309299ce@sentry.io/255536';

export const isSentryEnabled = !isDevelopment() && settings.get('allowAnalytics');

if (isSentryEnabled) {
  const release = `${app.name}@${app.getVersion()}`.toLowerCase();
  Sentry.init({
    dsn: SENTRY_PUBLIC_DSN,
    release
  });
}

export default Sentry;
