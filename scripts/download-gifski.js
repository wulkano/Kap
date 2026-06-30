'use strict';

// The gifski npm package is stuck at 1.7.1 (unmaintained since 2022), so fetch
// the universal (x86_64 + arm64) gifski binary from the official GitHub release.
// This keeps GIF export on a current, natively-running gifski with no Rosetta.
// macOS only, like the rest of Kap; uses curl + tar, which ship with macOS.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');

const VERSION = '1.34.0';
// SHA-256 of gifski-1.34.0.tar.xz from the official release, verified before use.
const SHA256 = 'b9b6591aa163123d737353d9c8581efdf3234d28eeaa45329b31da905cd5a996';

const destination = path.join(__dirname, '..', 'vendor', 'gifski');
const binary = path.join(destination, 'gifski');

const download = () => {
  if (fs.existsSync(binary)) {
    return;
  }

  const url = `https://github.com/ImageOptim/gifski/releases/download/${VERSION}/gifski-${VERSION}.tar.xz`;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gifski-'));
  const archive = path.join(temporary, 'gifski.tar.xz');

  try {
    execFileSync('curl', ['-fsSL', url, '-o', archive], {stdio: 'inherit'});

    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
    if (actualHash !== SHA256) {
      throw new Error(`gifski ${VERSION} checksum mismatch: expected ${SHA256}, got ${actualHash}`);
    }

    execFileSync('tar', ['xf', archive, '-C', temporary]);
    fs.mkdirSync(destination, {recursive: true});
    fs.copyFileSync(path.join(temporary, 'mac', 'gifski'), binary);
    fs.chmodSync(binary, 0o755);
    console.log(`gifski ${VERSION} (universal) installed to ${path.relative(process.cwd(), binary)}`);
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
};

download();
