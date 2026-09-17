'use strict';

// Fails the build if any bundled executable is missing the architecture we are
// packaging for.
//
// Several of Kap's dependencies ship prebuilt Swift helpers that are only built
// for the maintainer's own Mac. When one of those is Intel-only and lands in an
// arm64 build, nothing complains at package time - the app simply fails at
// runtime with EBADARCH ("Unknown system error -86") the first time it spawns
// that helper. Macs running macOS 27 or newer do not have Rosetta installed by
// default, so there is no longer a safety net.
//
// See https://github.com/wulkano/Kap/issues/1294

const path = require('path');
const {promises: fs} = require('fs');
const {promisify} = require('util');
const execFile = promisify(require('child_process').execFile);

const MACHO_MAGIC = new Set([
  0xFEEDFACE, // Mach-O 32-bit
  0xFEEDFACF, // Mach-O 64-bit
  0xCAFEBABE, // Universal (fat) binary
  0xCAFEBABF
]);

// Electron-builder passes `context.arch` as its `Arch` enum:
// 0 = ia32, 1 = x64, 2 = armv7l, 3 = arm64, 4 = universal.
const requiredArchitectures = new Map([
  [1, ['x86_64']],
  [3, ['arm64']],
  [4, ['x86_64', 'arm64']]
]);

// Dependencies whose published helpers are still Intel-only upstream, so a
// build cannot fix them. They are reported but do not fail the build. Delete an
// entry as soon as that package publishes a universal binary. Each one builds
// universal by adding `--arch arm64 --arch x86_64` to its `swift build`, the
// way `aperture` already does.
const knownIntelOnlyPackages = new Set([
  'mac-open-with',
  'mac-windows',
  'macos-audio-devices',
  'node-mac-app-icon'
]);

const packageNameFor = relativePath => {
  const segments = relativePath.split(path.sep);
  const index = segments.lastIndexOf('node_modules');
  return index === -1 ? undefined : segments[index + 1];
};

const isMachO = async filePath => {
  let handle;

  try {
    handle = await fs.open(filePath, 'r');
    const {buffer, bytesRead} = await handle.read(Buffer.alloc(4), 0, 4, 0);

    if (bytesRead < 4) {
      return false;
    }

    return MACHO_MAGIC.has(buffer.readUInt32BE(0)) || MACHO_MAGIC.has(buffer.readUInt32LE(0));
  } catch {
    return false;
  } finally {
    await handle?.close();
  }
};

const walk = async directory => {
  const entries = await fs.readdir(directory, {withFileTypes: true});
  const files = await Promise.all(entries.map(async entry => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isSymbolicLink()) {
      return [];
    }

    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  }));

  return files.flat();
};

const getArchitectures = async filePath => {
  try {
    const {stdout} = await execFile('lipo', ['-archs', filePath]);
    return stdout.trim().split(/\s+/);
  } catch {
    return [];
  }
};

exports.default = async context => {
  const {appOutDir} = context;
  const required = requiredArchitectures.get(context.arch);

  if (!required) {
    console.log(`  \u2022 skipping architecture check  arch=${context.arch}`);
    return;
  }

  const files = await walk(appOutDir);
  const offenders = [];
  const known = [];

  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    if (!await isMachO(file)) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const architectures = await getArchitectures(file);

    if (architectures.length === 0) {
      continue;
    }

    const missing = required.filter(architecture => !architectures.includes(architecture));

    if (missing.length === 0) {
      continue;
    }

    const relativePath = path.relative(appOutDir, file);
    const description = `${relativePath} is [${architectures.join(', ')}], missing [${missing.join(', ')}]`;

    if (knownIntelOnlyPackages.has(packageNameFor(relativePath))) {
      known.push(description);
    } else {
      offenders.push(description);
    }
  }

  for (const entry of known) {
    console.log(`  \u2022 known Intel-only dependency  ${entry}`);
  }

  if (offenders.length > 0) {
    throw new Error(
      'Bundled executables are missing required architectures:\n' +
      offenders.map(offender => `  - ${offender}`).join('\n') +
      '\n\nThese fail at runtime with EBADARCH on Macs without Rosetta.'
    );
  }

  console.log(`  \u2022 all bundled executables include ${required.join(' + ')}`);
};
