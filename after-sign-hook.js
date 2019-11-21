// See: https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db

'use strict';
const fs = require('fs');
const path = require('path');
const electronNotarize = require('electron-notarize');

module.exports = async function (params) {
  if (process.platform !== 'darwin') {
    return;
  }

  // Only notarize the app on the master branch
  if (process.env.CIRCLE_BRANCH !== 'master') {
    return;
  }

  // Same appId in electron-builder.
  const appId = 'com.wulkano.kap';

  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find app at: ${appPath}`);
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    await electronNotarize.notarize({
      appBundleId: appId,
      appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD
    });
  } catch (error) {
    console.error(error);
  }

  console.log(`Done notarizing ${appId}`);
};
