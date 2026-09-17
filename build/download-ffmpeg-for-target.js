'use strict';

// Re-downloads the `ffmpeg-static` binary for the architecture currently being
// packaged.
//
// `ffmpeg-static` picks its binary at install time from
// `npm_config_arch || os.arch()`, which is the architecture of the *build
// machine*, not of the target. Building both the x64 and the arm64 target on
// one machine therefore puts the same ffmpeg in both, and half of the releases
// ship an ffmpeg that cannot run. On an Intel CI machine that means the arm64
// build gets an Intel ffmpeg, which fails with EBADARCH on Macs without
// Rosetta.
//
// See https://github.com/wulkano/Kap/issues/1294

const path = require('path');
const {promisify} = require('util');
const execFile = promisify(require('child_process').execFile);

// Electron-builder's `Arch` enum: 0 = ia32, 1 = x64, 2 = armv7l, 3 = arm64.
const nodeArchNames = new Map([
  [1, 'x64'],
  [3, 'arm64']
]);

exports.default = async context => {
  const targetArch = nodeArchNames.get(context.arch);

  if (!targetArch) {
    return;
  }

  const installScript = require.resolve('ffmpeg-static/install.js');

  console.log(`  • fetching ffmpeg  arch=${targetArch}`);

  await execFile(process.execPath, [installScript], {
    cwd: path.dirname(installScript),
    env: {
      ...process.env,
      // eslint-disable-next-line camelcase
      npm_config_arch: targetArch
    }
  });
};
