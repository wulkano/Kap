#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const chalk = require('chalk')
const execa = require('execa')
const got = require('got')
const ora = require('ora')

let spinner = ora({text: 'Downloading Electron', stream: process.stdout}).start()

const ELECTRON_URL = 'https://dl.dropboxusercontent.com/u/71884/Electron%201.4.12%20with%20window%20level%20fix.zip'
const VENDOR_PATH = ['..', 'app', 'vendor']

const joinPath = (...str) => path.join(__dirname, ...str)
const which = cmd => execa.sync(joinPath('which.sh'), [cmd]).stdout
const cmdExists = cmd => which(cmd) !== ''
const logErrorAndExit = msg => {
  spinner.fail()
  console.error(chalk.red(msg))
  process.exit(1)
}

if (process.platform === 'darwin') {
  if (!cmdExists('brew')) {
    let msg = `${chalk.bold('Kap')} needs ${chalk.bold('brew')} in order to `
    msg += `automagically download ${chalk.bold('our custom Electron build')}.`
    // TODO add a link to a README.md section that explains what's going on here
    logErrorAndExit(msg)
  }

  const writeStream = fs.createWriteStream(joinPath(...VENDOR_PATH, 'Electron.zip'))
  writeStream.on('error', err => logErrorAndExit(err))
  writeStream.on('close', () => {
    spinner.succeed()
    spinner = ora({text: 'Bundling Electron', stream: process.stdout}).start()
    execa(joinPath('unzip-and-move-electron.sh'), [joinPath(...VENDOR_PATH)])
      .then(() => spinner.succeed())
      .catch(err => logErrorAndExit(err))
  })

  const electronDownloader = got.stream(ELECTRON_URL)
  let totalSize
  let downloadedSize = 0
  electronDownloader.on('response', res => {
    totalSize = parseInt(res.headers['content-length'], 10)
  })

  electronDownloader.on('data', chunk => {
    downloadedSize += chunk.length
    spinner.text = `Downloading Electron (${(100.0 * downloadedSize / totalSize).toFixed(2)}%)`
  })

  electronDownloader.pipe(writeStream)
}
