import path from 'path';
import {clipboard, shell, app} from 'electron';
import ensureError from 'ensure-error';
import cleanStack from 'clean-stack';
import isOnline from 'is-online';
import {openNewGitHubIssue} from 'electron-util';
import got from 'got';
import delay from 'delay';
import macosRelease from 'macos-release';

import {windowManager} from '../windows/manager';
import Sentry, {isSentryEnabled} from './sentry';
import {InstalledPlugin} from '../plugins/plugin';

const MAX_RETRIES = 10;

const ERRORS_TO_IGNORE = [
  /net::ERR_CONNECTION_TIMED_OUT/,
  /net::ERR_NETWORK_IO_SUSPENDED/,
  /net::ERR_CONNECTION_CLOSED/
];

const shouldIgnoreError = (errorText: string) => ERRORS_TO_IGNORE.some(regex => regex.test(errorText));

type SentryIssue = {
  issueId: string;
  shortId: string;
  permalink: string;
  ghUrl: string;
} | {
  issueId: string;
  shortId: string;
  permalink: string;
  ghIssueTemplate: string;
} | {
  error: string;
};

const getSentryIssue = async (eventId: string, tries = 0): Promise<SentryIssue | undefined | void> => {
  if (tries > MAX_RETRIES) {
    return;
  }

  try {
    // This endpoint will poll the Sentry API with the event ID until it gets an issue ID (~8 seconds).
    // It will then filter through GitHub issues to try and find an issue matching that issue ID.
    // It will return the issue information if it finds it or a partial template to use to create one if not.
    // https://github.com/wulkano/kap-sentry-tracker
    const {body} = await got.get(`https://kap-sentry-tracker.vercel.app/api/event/${eventId}`, {json: true});

    if (body.pending) {
      await delay(2000);
      return await getSentryIssue(eventId, tries + 1);
    }

    return body;
  } catch (error) {
    // We are not using `showError` again here to avoid an infinite error cycle
    console.log(error);
  }
};

const getPrettyStack = (error: Error) => {
  const pluginsPath = path.join(app.getPath('userData'), 'plugins', 'node_modules');
  return cleanStack(error.stack ?? '', {pretty: true, basePath: pluginsPath});
};

const release = macosRelease();

const getIssueBody = (title: string, errorStack: string, sentryTemplate = '') => `
${sentryTemplate}<!--
Thank you for helping us test Kap. Your feedback helps us make Kap better for everyone!
-->

**macOS version:**    ${release.name} (${release.version})
**Kap version:**      ${app.getVersion()}

\`\`\`
${title}

${errorStack}
\`\`\`

<!-- If you have additional information, enter it below. -->
`;

export const showError = async (
  error: Error,
  {
    title: customTitle,
    plugin
  }: {
    title?: string;
    plugin?: InstalledPlugin;
  } = {}
) => {
  await app.whenReady();
  const ensuredError = ensureError(error);
  const title = customTitle ?? ensuredError.name;
  const detail = getPrettyStack(ensuredError);

  console.log(error);
  if (shouldIgnoreError(`${title}\n${detail}`)) {
    return;
  }

  const mainButtons = [
    'Don\'t Report',
    {
      label: 'Copy Error',
      action: () => {
        clipboard.writeText(`${title}\n${detail}`);
      }
    }
  ];

  // If it's a plugin error, offer to open an issue on the plugin repo (if known)
  if (plugin) {
    const openIssueButton = plugin.repoUrl && {
      label: 'Open Issue',
      action: () => {
        openNewGitHubIssue({
          repoUrl: plugin.repoUrl,
          title,
          body: getIssueBody(title, detail)
        });
      }
    };

    return windowManager.dialog?.open({
      title,
      detail,
      cancelId: 0,
      defaultId: openIssueButton ? 2 : 0,
      buttons: [...mainButtons, openIssueButton].filter(Boolean)
    });
  }

  let message;
  const buttons: any[] = [...mainButtons];

  if (isOnline && isSentryEnabled) {
    const eventId = Sentry.captureException(ensuredError);
    const sentryIssuePromise = getSentryIssue(eventId);

    message = 'Reporting this issue will help us track it better and resolve it faster.';

    buttons.push({
      label: 'Collect Info and Report',
      activeLabel: 'Collecting Info…',
      action: async (_: unknown, updateUi: any) => {
        const issue = await sentryIssuePromise;

        if (!issue || 'error' in issue) {
          updateUi({
            message: 'Something went wrong while collecting the information.',
            buttons: mainButtons
          });
        } else if ('ghUrl' in issue) {
          updateUi({
            message: 'This issue is already being tracked!',
            buttons: [
              ...mainButtons, {
                label: 'View Issue',
                action: async () => shell.openExternal(issue.ghUrl)
              }
            ]
          });
        } else {
          updateUi({
            buttons: [
              ...mainButtons,
              {
                label: 'Open Issue',
                action: () => {
                  openNewGitHubIssue({
                    user: 'wulkano',
                    repo: 'kap',
                    title,
                    body: getIssueBody(title, detail, issue.ghIssueTemplate),
                    labels: ['sentry']
                  });
                }
              }
            ]
          });
        }
      }
    });
  }

  return windowManager.dialog?.open({
    title,
    detail,
    buttons,
    message,
    cancelId: 0,
    defaultId: buttons.length > 2 ? 2 : 0
  });
};

export const setupErrorHandling = () => {
  process.on('uncaughtException', error => {
    showError(error, {title: 'Unhandled Error'});
  });

  process.on('unhandledRejection', error => {
    showError(ensureError(error), {title: 'Unhandled Promise Rejection'});
  });
};
