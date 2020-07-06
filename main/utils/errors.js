'use strict';

const path = require('path');
const os = require('os');
const {clipboard, shell, app} = require('electron');
const ensureError = require('ensure-error');
const cleanStack = require('clean-stack');
const isOnline = require('is-online');
const {openNewGitHubIssue} = require('electron-util');
const got = require('got');
const delay = require('delay');

const {showDialog} = require('../dialog');

const MAX_RETRIES = 10;

const getSentryIssue = async (eventId, tries = 0) => {
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
      return getSentryIssue(eventId, tries + 1);
    }

    return body;
  } catch (error) {
    showError(error);
  }
};

const getPrettyStack = (error, isPluginError) => {
  const pluginsPath = path.join(app.getPath('userData'), 'plugins', 'node_modules');
  return cleanStack(error.stack, {pretty: true, basePath: isPluginError && pluginsPath});
};

const getIssueBody = (title, errorStack, sentryTemplate) => `
${sentryTemplate}<!--
Thank you for helping us test Kap. Your feedback helps us make Kap better for everyone!
-->

**macOS version:**    ${os.release()} (darwin)
**Kap version:**      ${app.getVersion()}
\`\`\`
${title}

${errorStack}
\`\`\`

<!-- If you have additional information, enter it below. -->
`;

const showError = async (error, {title: customTitle, plugin} = {}) => {
  const ensuredError = ensureError(error);
  const title = customTitle || ensuredError.name;
  const detail = getPrettyStack(ensuredError, plugin);
  const stack = cleanStack(ensuredError.stack);

  const mainButtons = [
    'Don\'t Report',
    {
      label: 'Copy Error',
      action: () => clipboard.writeText(`${title}\n${stack}`)
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
          body: getIssueBody(title, stack)
        });
      }
    };

    return showDialog({
      title,
      detail,
      cancelId: 0,
      defaultId: openIssueButton ? 2 : 0,
      buttons: [...mainButtons, openIssueButton].filter(Boolean)
    });
  }

  // Avoids circular dependency
  const settings = require('../common/settings');
  const Sentry = require('./sentry');

  let message;
  const buttons = [...mainButtons];

  if (isOnline && settings.get('allowAnalytics')) {
    const eventId = Sentry.captureException(ensuredError);
    const sentryIssuePromise = getSentryIssue(eventId);

    message = 'Reporting this issue will help us track it better and resolve it faster.';

    buttons.push({
      label: 'Collect Info and Report',
      activeLabel: 'Collecting Info…',
      action: async (_, updateUi) => {
        const issue = await sentryIssuePromise;

        if (!issue || issue.error) {
          updateUi({
            message: 'Something went wrong while collecting the information.',
            buttons: mainButtons
          });
        } else if (issue.ghUrl) {
          updateUi({
            message: 'This issue is already being tracked!',
            buttons: [
              ...mainButtons, {
                label: 'View Issue',
                action: () => shell.openExternal(issue.ghUrl)
              }
            ]
          });
        } else {
          updateUi({
            buttons: [
              ...mainButtons,
              {
                label: 'Open Issue',
                action: () => openNewGitHubIssue({
                  user: 'karaggeorge',
                  repo: 'kap-test-playground',
                  title,
                  body: getIssueBody(title, stack, issue.ghIssueTemplate),
                  labels: ['sentry']
                })
              }
            ]
          });
        }
      }
    });
  }

  return showDialog({
    title,
    detail,
    buttons,
    message,
    cancelId: 0,
    defaultId: buttons.length > 2 ? 2 : 0
  });
};

const setupErrorHandling = () => {
  process.on('uncaughtException', error => {
    showError(error, {title: 'Unhandled Error'});
  });

  process.on('unhandledRejection', error => {
    showError(error, {title: 'Unhandled Promise Rejection'});
  });
};

module.exports = {showError, setupErrorHandling};
