const path = require('path');
let electronPath = require('electron');
const test = require('ava');
const {Application} = require('spectron');

const appPath = path.join(__dirname, '..');

if (process.platform === 'win32') {
  electronPath += '.cmd';
}

const app = new Application({

  path: electronPath,
  args: [appPath],
  requireName: 'electronRequire',
  env: {ELECTRON_ENABLE_LOGGING: true, ELECTRON_ENABLE_STACK_DUMPING: true, NODE_ENV: 'test'},
  startTimeout: 5000,
  waitTimeout: 8000
});

test.beforeEach(async () => {
  await app.start();
});

test.afterEach.always(async () => {
  await app.stop();
});

test('launch app and get information', async t => {
  console.log(app.getSettings());
  const {client} = app;
  // Needs 2 windows because of dev tools
  t.is(await client.getWindowCount(), 2);
});
