'use strict';

import {app} from 'electron';
import {is} from 'electron-util';
import * as Sentry from '@sentry/electron';
import {settings} from '../common/settings';
import {ipcMain} from 'electron-better-ipc';

const SENTRY_PUBLIC_DSN = 'https://2dffdbd619f34418817f4db3309299ce@sentry.io/255536';

export const isSentryEnabled = !is.development && settings.get('allowAnalytics');

if (isSentryEnabled) {
  const release = `${app.name}@${app.getVersion()}`.toLowerCase();
  Sentry.init({
    dsn: SENTRY_PUBLIC_DSN,
    release
  });
}

export default Sentry;

export function initializeSentryListeners() {
  ipcMain.answerRenderer<{error: Error; errorInfo?: Record<string, unknown>}>('capture-error', async ({error, errorInfo}) => {
    if (errorInfo) {
      Sentry.configureScope(scope => {
        for (const [key, value] of Object.entries(errorInfo)) {
          scope.setExtra(key, value);
        }
      });
    }

    Sentry.captureException(error);
  });
}
