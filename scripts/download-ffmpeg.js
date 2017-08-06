#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const execa = require('execa');
const got = require('got');
const ora = require('ora');

let spinner = ora({text: 'Installing 7zip', stream: process.stdout}).start();

const FFMPEG_URL = 'https://evermeet.cx/pub/ffmpeg/ffmpeg-3.2.2.7z';
const VENDOR_PATH = ['..', 'app', 'vendor'];

const joinPath = (...str) => path.join(__dirname, ...str);
const which = cmd => execa.sync(joinPath('which.sh'), [cmd]).stdout;
const cmdExists = cmd => which(cmd) !== '';
const logErrorAndExit = msg => {
  spinner.fail();
  console.error(chalk.red(msg));
  process.exit(1);
};

if (process.platform === 'darwin') {
  if (!cmdExists('brew')) {
    let msg = `${chalk.bold('Kap')} needs ${chalk.bold('brew')} in order to `;
    msg += `automagically download ${chalk.bold('ffmpeg')}.`;
    // TODO add a link to a README.md section that explains what's going on here
    logErrorAndExit(msg);
  }

  execa(joinPath('brew-install-7zip.sh'))
    .then(() => {
      spinner.succeed();
      spinner = ora({text: 'Downloading ffmpeg (0%)', stream: process.stdout}).start();
      fs.mkdir(joinPath(...VENDOR_PATH), err => {
        if (err && err.code !== 'EEXIST') {
          logErrorAndExit(err);
        }

        const writeStream = fs.createWriteStream(joinPath(...VENDOR_PATH, 'ffmpeg.7z'));
        writeStream.on('error', err => logErrorAndExit(err));
        writeStream.on('close', () => {
          spinner.succeed();
          spinner = ora({text: 'Bundling ffmpeg', stream: process.stdout}).start();
          execa(joinPath('unzip-ffmpeg.sh'), [joinPath(...VENDOR_PATH)])
            .then(() => spinner.succeed())
            .catch(err => logErrorAndExit(err));
        });

        const ffmpegDownloader = got.stream(FFMPEG_URL);
        let totalSize;
        let downloadedSize = 0;
        ffmpegDownloader.on('response', res => {
          totalSize = parseInt(res.headers['content-length'], 10);
        });

        ffmpegDownloader.on('data', chunk => {
          downloadedSize += chunk.length;
          spinner.text = `Downloading ffmpeg (${(100.0 * downloadedSize / totalSize).toFixed(2)}%)`;
        });

        ffmpegDownloader.pipe(writeStream);
      });
    })
    .catch(logErrorAndExit);
} else {
  logErrorAndExit(`Currently, ${chalk.bold('Kap')} only runs on macOS`);
}
