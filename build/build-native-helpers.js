'use strict';

// Several dependencies publish their Swift helpers as Intel-only prebuilt binaries,
// which fail with EBADARCH on Apple silicon Macs without Rosetta (the default on
// macOS 27). This builds an arm64 slice from the sources vendored in `native/` and
// combines it with the published x86_64 slice, so Intel Macs keep running the exact
// binary they always have. See native/README.md.

const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const root = path.join(__dirname, '..');

const helpers = [
  {source: 'open-with', product: 'open-with', destination: 'mac-open-with/open-with'},
  {source: 'mac-windows', product: 'mac-windows', destination: 'mac-windows/scripts/MacWindows'},
  {source: 'activate-window', product: 'activate-window', destination: 'mac-windows/scripts/ActivateWindow'},
  {source: 'audio-devices', product: 'audio-devices', destination: 'macos-audio-devices/audio-devices'},
  {source: 'get-app-icon', product: 'GetAppIcon', destination: 'node-mac-app-icon/run'}
];

const archsOf = file => execFileSync('lipo', ['-archs', file], {encoding: 'utf8'}).trim().split(' ').sort().join(' ');

const build = ({source, product, destination}) => {
  const target = path.join(root, 'node_modules', destination);
  const intel = `${target}.x86_64`;
  const staged = `${target}.universal`;

  try {
    // The target is the published Intel binary, or a universal one from a previous run
    let intelSlice = target;
    if (archsOf(target) !== 'x86_64') {
      execFileSync('lipo', [target, '-thin', 'x86_64', '-output', intel]);
      intelSlice = intel;
    }

    const swiftArgs = [
      'build',
      '--configuration',
      'release',
      '--arch',
      'arm64',
      '--package-path',
      path.join(root, 'native', source)
    ];

    console.log(`Building ${source} for arm64…`);
    execFileSync('swift', swiftArgs, {stdio: 'inherit'});
    const binPath = execFileSync('swift', [...swiftArgs, '--show-bin-path'], {encoding: 'utf8'}).trim();

    execFileSync('lipo', ['-create', intelSlice, path.join(binPath, product), '-output', staged]);
    if (archsOf(staged) !== 'arm64 x86_64') {
      throw new Error(`${destination} was not built as a universal binary`);
    }

    // Rename a new file into place rather than overwriting, so macOS can't reuse the
    // code signature it cached for the old one
    fs.renameSync(staged, target);
    return execFileSync('vtool', ['-arch', 'arm64', '-show-build', target], {encoding: 'utf8'}).match(/minos (\S+)/)[1];
  } finally {
    fs.rmSync(intel, {force: true});
    fs.rmSync(staged, {force: true});
  }
};

if (process.platform === 'darwin') {
  const highest = Math.max(...helpers.map(helper => Number.parseFloat(build(helper))));
  if (highest > 11) {
    console.warn(`Warning: the arm64 helpers require macOS ${highest}, so they won't run on Apple silicon Macs with macOS 11. Build releases with Xcode 26 or earlier.`);
  }
}
