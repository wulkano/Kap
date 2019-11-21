// See: https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db

'use strict';
const fs = require('fs');
const path = require('path');
const electronNotarize = require('electron-notarize');

module.exports = async params => {
  if (process.platform !== 'darwin') {
    return;
  }

  // Only notarize the app on the master branch
  // if (process.env.CIRCLE_BRANCH !== 'master') {
  //   return;
  // }

  const packageJson = JSON.parse(fs.readFileSync('./package.json'));
  const {appId} = packageJson.build;

  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);

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
    return;
  }

  console.log(`Done notarizing ${appId}`);
};
