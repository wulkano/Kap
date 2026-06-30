import path from 'path';
import util from 'electron-util';

// The gifski npm package is frozen at 1.7.1, so the universal (x86_64 + arm64)
// gifski 1.34 binary is fetched from the official GitHub release into
// vendor/gifski by scripts/download-gifski.js (run on postinstall).
const gifskiBin = path.join(__dirname, '..', '..', 'vendor', 'gifski', 'gifski');

const gifskiPath = util.fixPathForAsarUnpack(gifskiBin);

export default gifskiPath;
