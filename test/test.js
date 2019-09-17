const path = require('path');
let electronPath = require('electron');
const BrowserWindow = require('electron');
const test = require('ava');
const {Application} = require('spectron');

const appPath = path.join(__dirname, '..');

if (process.platform === 'win32') {
  electronPath += '.cmd';
}

const setupApp = async () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900
  });
  await mainWindow.loadFile(path.join(__dirname, '../pages/_app.js'));
  await mainWindow.waitUntilWindowLoaded();
};

const app = new Application({

  path: electronPath,
  args: [appPath],
  requireName: 'electronRequire',
  env: {ELECTRON_ENABLE_LOGGING: true, ELECTRON_ENABLE_STACK_DUMPING: true, NODE_ENV: 'test'},
  startTimeout: 5000,
  waitTimeout: 8000
});

test.beforeEach(async () => {
  await app.start(setupApp);
});

test.afterEach.always(async () => {
  await app.stop();
});

test('launch app and get information', async t => {
  const {client} = app;
  // Needs 2 windows because of dev tools
  t.is(await client.getWindowCount(), 2);
});
